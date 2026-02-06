import json
import os
import re
from datetime import datetime
import hashlib
from typing import Any, Dict, List, Optional, Tuple

import streamlit as st
try:
    from dotenv import load_dotenv  # type: ignore
except Exception:  # pragma: no cover
    load_dotenv = None
try:
    import requests  # type: ignore
except Exception:  # pragma: no cover
    requests = None  # Fallback if not installed; UI will show guidance
try:
    from pypdf import PdfReader  # type: ignore
except Exception:  # pragma: no cover
    PdfReader = None  # Fallback if not installed


# -------------------------------
# Constants and simple utilities
# -------------------------------

DEFAULT_MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "semantic_model.json")
GENERATED_MODEL_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "static", "rodeos", "generated_semanticmodel.json",
)

LEVEL_BG = {
    0: "#E3F2FD",  # Base Resource - light blue
    1: "#E8F5E9",  # Core Type - light green
    2: "#FFF9C4",  # Subtype - light yellow
}
LEVEL_BG_FALLBACK = "#F3E5F5"  # Level 3+ - light purple/lavender

MANDATORY_EMPTY_BG = "#FFEBEE"  # red/pink tint
MANDATORY_FILLED_BG = "#F1F8F4"  # very light green
OPTIONAL_BG = "#F5F5F5"  # light gray

TYPE_ICONS = {
    "dcat:Resource": "📋",
    "rodeos:Dataset": "📊",
    "rodeos:Component": "🔧",
    "rodeos:Service": "🌐",
    "robot": "🤖",
    "stationary": "🏭",
    "serial": "🔗",
    "seriel": "🔗",  # spelling in model
    "articulated": "📍",
}


def get_level_bg(level_idx: int) -> str:
    return LEVEL_BG.get(level_idx, LEVEL_BG_FALLBACK)


def type_icon_for(name: str) -> str:
    # Exact matches first
    if name in TYPE_ICONS:
        return TYPE_ICONS[name]
    # Heuristic contains
    lowered = name.lower()
    for key, icon in TYPE_ICONS.items():
        if key in lowered:
            return icon
    return "•"


# -------------------------------
# Semantic model loading
# -------------------------------

def load_semantic_model(file_path_or_bytes: Any) -> Dict[str, Any]:
    """Parse the semantic model JSON from a path or raw bytes/string."""
    if isinstance(file_path_or_bytes, (bytes, bytearray)):
        return json.loads(file_path_or_bytes.decode("utf-8"))
    if isinstance(file_path_or_bytes, str):
        with open(file_path_or_bytes, "r", encoding="utf-8") as f:
            return json.load(f)
    if hasattr(file_path_or_bytes, "read"):
        return json.loads(file_path_or_bytes.read().decode("utf-8"))
    raise ValueError("Unsupported input for semantic model loading")


def get_level(model: Dict[str, Any], path: List[str]) -> Dict[str, Any]:
    """Return the schema dict for the node at the given path.

    Path starts with the root key (e.g., ["dcat:Resource"]).
    """
    node = model
    for i, key in enumerate(path):
        if i == 0:
            node = node.get(key, {})
        else:
            node = node.get("instances", {}).get(key, {})
    return node or {}


def _project_root() -> str:
    """Return the project root (parent of the rodeos/ package directory)."""
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def init_state():
    # Load .env for defaults (once per process)
    if load_dotenv is not None and not os.environ.get("_RODEOS_DOTENV_LOADED"):
        try:
            env_path = os.path.join(_project_root(), ".env")
            load_dotenv(env_path)
            os.environ["_RODEOS_DOTENV_LOADED"] = "1"
        except Exception:
            pass
    if "model" not in st.session_state:
        st.session_state.model = load_semantic_model(DEFAULT_MODEL_PATH)
        st.session_state.model_source = DEFAULT_MODEL_PATH
        st.session_state.model_source_meta = model_file_metadata(DEFAULT_MODEL_PATH)
    if "path" not in st.session_state:
        st.session_state.path = ["dcat:Resource"]
    if "form_data" not in st.session_state:
        st.session_state.form_data = {}
    if "selected_subtypes" not in st.session_state:
        st.session_state.selected_subtypes = {}
    if "messages" not in st.session_state:
        st.session_state.messages = []
    # LLM-related session state defaults
    if "input_mode" not in st.session_state:
        st.session_state.input_mode = "llm"  # "llm" or "manual"
    if "llm_provider" not in st.session_state:
        st.session_state.llm_provider = os.getenv("LLM_PROVIDER", "ollama")
    if "llm_config" not in st.session_state:
        st.session_state.llm_config = {
            "ollama_base_url": os.getenv("OLLAMA_ENDPOINT", "http://localhost:11434"),
            "ollama_model": os.getenv("OLLAMA_MODEL", None),
            "openrouter_model": os.getenv("OPENROUTER_MODEL", None),
            "openrouter_api_key": os.getenv("OPENROUTER_API_KEY", None),
        }
    if "llm_generated_fields" not in st.session_state:
        st.session_state.llm_generated_fields = set()
    if "llm_user_description" not in st.session_state:
        st.session_state.llm_user_description = ""
    if "pdf_extracted_text" not in st.session_state:
        st.session_state.pdf_extracted_text = None


def model_file_metadata(path: str) -> Dict[str, Any]:
    try:
        stat = os.stat(path)
        return {
            "path": path,
            "size": stat.st_size,
            "mtime": datetime.fromtimestamp(stat.st_mtime).isoformat(timespec="seconds"),
        }
    except Exception:
        return {"path": path}


# -------------------------------
# Validation helpers
# -------------------------------

URI_RE = re.compile(r"^[a-zA-Z][a-zA-Z0-9+.-]*:.+$")
HEX_RE = re.compile(r"^[0-9A-Fa-f]+$")


def validate_value(value: Any, field_type: str) -> Tuple[bool, Optional[str]]:
    if value is None or value == "":
        return False, "Required" if field_type != "optional" else None

    if field_type.startswith("enum["):
        # value must be one of enum items
        options = [v.strip() for v in field_type[5:-1].split(",")]
        if value not in options:
            return False, "Value not in enum"
        return True, None

    if field_type == "xsd:integer":
        try:
            int(str(value).strip())
            return True, None
        except Exception:
            return False, "Must be an integer"

    if field_type == "xsd:decimal":
        try:
            float(str(value).strip())
            return True, None
        except Exception:
            return False, "Must be a decimal number"

    if field_type == "xsd:boolean":
        # value is True/False
        return True, None

    if field_type == "xsd:anyUri":
        if not URI_RE.match(str(value).strip()):
            return False, "Must be a valid URI"
        return True, None

    if field_type == "xsd:hexBinary":
        if not HEX_RE.match(str(value).strip()):
            return False, "Hex characters only"
        return True, None

    if field_type.startswith("List["):
        # Comma-separated; allow empty entries after strip
        inner = field_type[5:-1]
        items = [i.strip() for i in str(value).split(",") if i.strip() != ""]
        if inner == "xsd:integer":
            try:
                [int(i) for i in items]
            except Exception:
                return False, "All items must be integers"
        elif inner == "xsd:decimal":
            try:
                [float(i) for i in items]
            except Exception:
                return False, "All items must be decimals"
        return True, None

    # Free-text-like types
    return True, None


def collect_mandatory_fields(model: Dict[str, Any], path: List[str]) -> List[Tuple[str, str]]:
    """Return list of (field_name, field_type) for all mandatory fields along path."""
    fields: List[Tuple[str, str]] = []
    for i in range(len(path)):
        lvl_schema = get_level(model, path[: i + 1])
        for fname, ftype in (lvl_schema.get("mandatory") or {}).items():
            fields.append((fname, ftype))
    return fields


def is_form_valid(model: Dict[str, Any], path: List[str], form_data: Dict[str, Any]) -> Tuple[bool, List[str]]:
    errors: List[str] = []
    for fname, ftype in collect_mandatory_fields(model, path):
        val = form_data.get(fname)
        # booleans: False is acceptable value for mandatory checkbox
        if ftype == "xsd:boolean":
            if val is None:
                errors.append(f"Missing required: {fname}")
            continue
        # Lists: must be non-empty
        if isinstance(ftype, str) and ftype.startswith("List["):
            if val is None:
                errors.append(f"Missing required: {fname}")
                continue
            if isinstance(val, list):
                if len(val) == 0:
                    errors.append(f"{fname}: At least one item required")
                    continue
            elif isinstance(val, str):
                if len([i.strip() for i in val.split(",") if i.strip() != ""]) == 0:
                    errors.append(f"{fname}: At least one item required")
                    continue
            # If not list or string, fallback to validator
        ok, msg = validate_value(val, ftype)
        if not ok:
            errors.append(f"{fname}: {msg or 'Invalid'}")
    return len(errors) == 0, errors


# -------------------------------
# Rendering helpers
# -------------------------------

def field_default_value(level_schema: Dict[str, Any], field_name: str) -> Optional[Any]:
    defaults = level_schema.get("defaultValues") or {}
    return defaults.get(field_name)


def _is_value_filled(field_type: str, value: Any) -> bool:
    if value is None:
        return False
    if field_type == "xsd:boolean":
        return value is not None
    if field_type.startswith("List["):
        if isinstance(value, list):
            return len(value) > 0
        # treat non-list strings as empty unless non-empty content
        return str(value).strip() != ""
    # default: non-empty after strip
    return str(value).strip() != ""


def widget_display_value(field_type: str, value: Any) -> Any:
    if field_type.startswith("enum["):
        return value if isinstance(value, str) else "-- Select --"
    if field_type == "xsd:boolean":
        return bool(value) if value is not None else False
    if field_type.startswith("List["):
        if isinstance(value, list):
            return ", ".join(str(v) for v in value)
        return value or ""
    # All other text_input-backed fields should be strings
    return str(value) if value is not None else ""


def render_field(field_name: str, field_type: str, is_mandatory: bool, level_schema: Dict[str, Any], level_key: str):
    """Render a field widget and update session_state.form_data.

    Ensures optional fields are always visible. Adds validation hints and background badges.
    """
    key = f"field::{level_key}::{field_name}"
    current = st.session_state.form_data.get(field_name)
    if current is None:
        dv = field_default_value(level_schema, field_name)
        if dv is not None:
            current = dv
            st.session_state.form_data[field_name] = dv

    # Check if field is filled (type-aware)
    filled = _is_value_filled(field_type, current)
    
    # Optionally prime widget state after LLM sync so display matches stored values
    if st.session_state.get("_llm_sync_pending"):
        if _is_value_filled(field_type, current):
            st.session_state[key] = widget_display_value(field_type, current)

    # Label with red indicator for empty mandatory fields
    if is_mandatory and not filled:
        label = f"🔴 {field_name} *"
    elif is_mandatory:
        label = f"{field_name} *"
    else:
        label = f"{field_name}"
    
    help_text = None

    # Render by type
    if field_type.startswith("enum["):
        options = ["-- Select --"] + [v.strip() for v in field_type[5:-1].split(",")]
        idx = 0
        if isinstance(current, str) and current in options:
            idx = options.index(current)
        choice = st.selectbox(label, options, index=idx, key=key)
        value = None if choice == "-- Select --" else choice

    elif field_type == "xsd:text" or field_type in ("skos:concept", "schema:quantitativeValue", "xsd:duration"):
        value = st.text_input(label, value=current or "", key=key)

    elif field_type == "xsd:integer":
        value = st.text_input(label, value=str(current) if current is not None else "", key=key, placeholder="e.g., 42")
        if value:
            try:
                int(value)
            except Exception:
                st.caption("⚠️ Must be an integer")

    elif field_type == "xsd:decimal":
        value = st.text_input(label, value=str(current) if current is not None else "", key=key, placeholder="e.g., 3.14")
        if value:
            try:
                float(value)
            except Exception:
                st.caption("⚠️ Must be a decimal number")

    elif field_type == "xsd:boolean":
        value = st.checkbox(label, value=bool(current) if current is not None else False, key=key)

    elif field_type == "xsd:anyUri":
        value = st.text_input(label, value=current or "", key=key, placeholder="https://...")
        if value and not URI_RE.match(value):
            st.caption("⚠️ Must be a valid URI")

    elif field_type == "xsd:hexBinary":
        value = st.text_input(label, value=current or "", key=key, placeholder="0A1B2C...")
        if value and not HEX_RE.match(value):
            st.caption("⚠️ Hex characters only")

    elif field_type.startswith("List["):
        value = st.text_area(label, value=(", ".join(current) if isinstance(current, list) else (current or "")), key=key, placeholder="item1, item2, item3")

    else:
        value = st.text_input(label, value=current or "", key=key)

    # Normalize Lists into Python lists
    if field_type.startswith("List["):
        # Allow both list and comma-separated input (textarea returns str)
        if isinstance(value, list):
            items = value
        else:
            items = [i.strip() for i in str(value).split(",") if i.strip() != ""]
        st.session_state.form_data[field_name] = items
    else:
        st.session_state.form_data[field_name] = value


def render_instances_selector(level_key: str, level_schema: Dict[str, Any]) -> Optional[str]:
    instances = (level_schema.get("instances") or {})
    if not instances:
        return None
    opts = list(instances.keys())
    current = st.session_state.selected_subtypes.get(level_key)
    if current and current not in opts:
        current = None
    label = "Select subtype"
    idx = 0
    options = ["-- Select --"] + opts
    if current and current in opts:
        idx = options.index(current)
    choice = st.selectbox(label, options, index=idx, key=f"subtype::{level_key}")
    selected = None if choice == "-- Select --" else choice
    st.session_state.selected_subtypes[level_key] = selected
    return selected


def render_level(level_schema: Dict[str, Any], level_idx: int, level_key: str, path: List[str]):
    bg = get_level_bg(level_idx)
    icon = type_icon_for(level_key)
    st.markdown(
        f"<div style='padding:20px;margin:16px 0;background:{bg};border-radius:10px;border:1px solid rgba(0,0,0,0.12)'>",
        unsafe_allow_html=True,
    )
    st.markdown(f"### {icon} {level_key}")

    # Mandatory first
    mandatory = level_schema.get("mandatory") or {}
    optional = level_schema.get("optional") or {}

    if mandatory:
        st.markdown("**Required Fields**")
        for fname, ftype in mandatory.items():
            render_field(fname, ftype, True, level_schema, level_key)

    if optional:
        st.markdown("")  # Add spacing
        st.markdown("**Optional Fields**")
        for fname, ftype in optional.items():
            render_field(fname, ftype, False, level_schema, level_key)

    # Check if there is a discriminator enum that maps to instances
    instances_map = (level_schema.get("instances") or {})
    enum_discriminator_used = False
    selected = None
    
    if instances_map:
        discriminator_value: Optional[str] = None
        discriminator_field: Optional[str] = None
        # Find an enum in mandatory fields that could represent the subtype
        for fname, ftype in (mandatory or {}).items():
            if isinstance(ftype, str) and ftype.startswith("enum["):
                enum_vals = [v.strip() for v in ftype[5:-1].split(",")]
                current_val = st.session_state.form_data.get(fname)
                if current_val in enum_vals:
                    discriminator_value = current_val
                    discriminator_field = fname
                    break
        
        if discriminator_value:
            # Try to map enum to instance key by suffix/containment
            mapped_instance_key = None
            for inst_key in instances_map.keys():
                last_part = inst_key.split(":")[-1]
                if last_part == discriminator_value or discriminator_value in last_part:
                    mapped_instance_key = inst_key
                    break
            
            if mapped_instance_key:
                # Enum discriminator maps to an instance - skip showing that instance selector
                # Instead, directly render that instance's children
                enum_discriminator_used = True
                st.session_state.selected_subtypes[level_key] = mapped_instance_key
                selected = mapped_instance_key
                
                st.markdown("</div>", unsafe_allow_html=True)
                
                # Get the schema of the mapped instance
                child_schema = instances_map.get(mapped_instance_key) or {}
                child_instances = child_schema.get("instances") or {}
                
                # If the mapped instance has its own instances, render them as options
                if child_instances:
                    # Render the child level with a selector for its instances
                    render_level(child_schema, level_idx + 1, mapped_instance_key, path + [mapped_instance_key])
                else:
                    # Leaf node - just render the fields
                    render_level(child_schema, level_idx + 1, mapped_instance_key, path + [mapped_instance_key])
                return  # Exit early since we've handled the recursion

    # Only show instance selector if enum discriminator wasn't used
    if not enum_discriminator_used and instances_map:
        selected = render_instances_selector(level_key, level_schema)
        # Sync enum discriminator from selected instance back to the field
        if selected and (mandatory or {}):
            for fname, ftype in (mandatory or {}).items():
                if isinstance(ftype, str) and ftype.startswith("enum["):
                    enum_vals = [v.strip() for v in ftype[5:-1].split(",")]
                    last_part = selected.split(":")[-1]
                    # Prefer exact match, else containment
                    if last_part in enum_vals:
                        st.session_state.form_data[fname] = last_part
                    else:
                        for ev in enum_vals:
                            if ev in last_part:
                                st.session_state.form_data[fname] = ev
                                break
    
    st.markdown("</div>", unsafe_allow_html=True)

    # Recurse if a subtype is selected (and not already handled by enum discriminator)
    if selected and not enum_discriminator_used:
        child_schema = (level_schema.get("instances") or {}).get(selected) or {}
        render_level(child_schema, level_idx + 1, selected, path + [selected])


def build_breadcrumb(path: List[str]) -> List[Tuple[str, str]]:
    items = []
    for i, key in enumerate(path):
        items.append((key, type_icon_for(key)))
    # Append any live subtype selections beyond explicit path
    # Path is authoritative; rendering controls updating it via buttons
    return items


def sidebar_source_section():
    st.subheader("Semantic Model Source")
    source = st.session_state.model_source
    meta = st.session_state.model_source_meta or {"path": source}

    is_default = source == DEFAULT_MODEL_PATH
    badge = "(default)" if is_default else "(custom)"
    st.write(f"File: `{meta.get('path', source)}` {badge}")
    if "size" in meta:
        st.caption(f"Size: {meta['size']} bytes")
    if "mtime" in meta:
        st.caption(f"Modified: {meta['mtime']}")

    uploaded = st.file_uploader("Load another semantic model (.json)", type=["json"])
    if uploaded is not None:
        try:
            st.session_state.model = load_semantic_model(uploaded)
            st.session_state.model_source = uploaded.name
            st.session_state.model_source_meta = {"path": uploaded.name, "size": uploaded.size}
            # Reset selections when model changes
            st.session_state.path = ["dcat:Resource"]
            st.session_state.form_data = {}
            st.session_state.selected_subtypes = {}
            st.success("Semantic model loaded.")
        except Exception as e:
            st.error(f"Failed to load model: {e}")


def sidebar_breadcrumb_section():
    st.subheader("Selection Hierarchy")
    path = st.session_state.path
    for i, (name, icon) in enumerate(build_breadcrumb(path)):
        indent = "&nbsp;" * (i * 4)
        col1, col2 = st.columns([0.85, 0.15])
        with col1:
            st.markdown(f"{indent}{icon} `{name}`", unsafe_allow_html=True)
        with col2:
            if st.button("Go", key=f"crumb::{i}"):
                # Truncate path to this level and drop deeper selections
                st.session_state.path = path[: i + 1]
                # Also drop subtypes chosen below this level
                keys_to_remove = [k for k in st.session_state.selected_subtypes.keys() if k not in st.session_state.path]
                for k in keys_to_remove:
                    st.session_state.selected_subtypes.pop(k, None)
                st.rerun()


def render_sidebar(current_path: List[str]):
    with st.sidebar:
        sidebar_source_section()
        st.divider()
        sidebar_pdf_upload()
        if st.session_state.input_mode == "llm":
            st.divider()
        sidebar_breadcrumb_section()
        st.divider()
        sidebar_llm_configuration()


# -------------------------------
# LLM configuration + helpers
# -------------------------------

def extract_text_from_pdf(pdf_file) -> Tuple[bool, str]:
    """Extract text content from uploaded PDF file."""
    if PdfReader is None:
        return False, "pypdf not installed. Run: uv add pypdf"
    try:
        pdf_reader = PdfReader(pdf_file)
        text_parts = []
        for page in pdf_reader.pages:
            text = page.extract_text()
            if text:
                text_parts.append(text)
        
        full_text = "\n\n".join(text_parts)
        if not full_text.strip():
            return False, "No text content found in PDF"
        
        return True, full_text
    except Exception as e:
        return False, f"Failed to extract PDF text: {str(e)}"


def llm_extract_description_from_pdf(pdf_text: str) -> Tuple[bool, str]:
    """Use LLM to extract asset description and key parameters from PDF text."""
    provider = st.session_state.llm_provider
    cfg = st.session_state.llm_config
    
    system_prompt = (
        "You are an expert at analyzing technical documents and extracting key information. "
        "Read the provided PDF text and create a concise but comprehensive description of the asset described. "
        "Focus on: type of asset, key technical specifications, capabilities, features, and intended use. "
        "Format the output as a clear, structured description suitable for semantic model generation. "
        "Keep the description between 200-500 words."
    )
    
    user_prompt = (
        f"Extract and summarize the key asset information from this document:\n\n{pdf_text[:8000]}\n\n"
        "Provide a structured description including: asset type, key specifications, capabilities, and use cases."
    )
    
    if provider == "ollama":
        model_name = cfg.get("ollama_model")
        base_url = cfg.get("ollama_base_url") or "http://localhost:11434"
        if not model_name or model_name == "<none>":
            return False, "No Ollama model selected. Please configure Ollama in the sidebar."
        ok, content = llm_query_ollama(base_url, model_name, system_prompt, user_prompt)
    else:  # openrouter
        api_key = cfg.get("openrouter_api_key")
        model_name = cfg.get("openrouter_model") or ""
        if not api_key:
            return False, "OpenRouter API key missing. Please configure it in the LLM Configuration section."
        if not model_name:
            return False, "OpenRouter model not selected. Please configure it in the LLM Configuration section."
        ok, content = llm_query_openrouter(api_key, model_name, system_prompt, user_prompt)
    
    if not ok:
        # Parse OpenRouter error for better user feedback
        if "404" in content and "No endpoints found" in content:
            return False, (
                f"Model '{model_name}' is not available or has data policy restrictions. "
                "Please try a different model in the LLM Configuration section. "
                "Recommended models: 'google/gemini-2.0-flash-exp:free', 'meta-llama/llama-3.2-3b-instruct:free', "
                "or any paid model like 'anthropic/claude-3.5-sonnet'."
            )
        return False, f"LLM query failed: {content}"
    
    return True, content.strip()


def sidebar_pdf_upload():
    """Render PDF upload section in sidebar (only in LLM mode)."""
    if st.session_state.input_mode != "llm":
        return
    
    st.subheader("📄 PDF Upload")
    st.caption("Upload a PDF to auto-extract asset description")
    
    # Check LLM configuration first
    provider = st.session_state.llm_provider
    cfg = st.session_state.llm_config
    llm_configured = False
    
    if provider == "ollama":
        llm_configured = bool(cfg.get("ollama_model") and cfg.get("ollama_model") != "<none>")
    else:  # openrouter
        llm_configured = bool(cfg.get("openrouter_api_key") and cfg.get("openrouter_model"))
    
    if not llm_configured:
        st.warning("⚠️ Please configure LLM settings below before uploading PDF")
        return
    
    uploaded_pdf = st.file_uploader(
        "Select PDF file",
        type=["pdf"],
        key="pdf_uploader",
        help="Upload a technical document describing the asset. The LLM will extract key information."
    )
    
    if uploaded_pdf is not None:
        with st.spinner("Extracting text from PDF..."):
            ok, result = extract_text_from_pdf(uploaded_pdf)
            
            if not ok:
                st.error(result)
                return
            
            pdf_text = result
            st.success(f"✓ Extracted {len(pdf_text)} characters")
            
            # Show preview of extracted text
            with st.expander("Preview extracted text"):
                st.text_area(
                    "Raw PDF text (first 1000 chars)",
                    value=pdf_text[:1000] + ("..." if len(pdf_text) > 1000 else ""),
                    height=150,
                    disabled=True,
                    key="pdf_preview"
                )
        
        if st.button("🤖 Extract Description with LLM", key="extract_description_btn"):
            with st.spinner("Processing with LLM..."):
                ok, description = llm_extract_description_from_pdf(pdf_text)
                
                if not ok:
                    st.error("❌ " + description)
                else:
                    st.session_state.llm_user_description = description
                    st.session_state.pdf_extracted_text = pdf_text
                    st.success("✓ Description extracted and inserted!")
                    st.rerun()


def sidebar_llm_configuration():
    st.subheader("LLM Configuration")

    st.session_state.llm_provider = st.selectbox(
        "LLM Provider",
        options=["ollama", "openrouter"],
        index=0 if st.session_state.llm_provider == "ollama" else 1,
    )

    if st.session_state.llm_provider == "ollama":
        base_url = st.text_input(
            "Ollama API Endpoint",
            value=st.session_state.llm_config.get("ollama_base_url") or "http://localhost:11434",
            help="Default Ollama endpoint is http://localhost:11434",
        )
        st.session_state.llm_config["ollama_base_url"] = base_url

        cols = st.columns([0.5, 0.5])
        with cols[0]:
            if st.button("Test Connection", key="ollama_test_conn"):
                ok, msg = test_ollama_connection(base_url)
                if ok:
                    st.success("Ollama reachable")
                else:
                    st.error(msg)
        with cols[1]:
            if st.button("Refresh Models", key="ollama_refresh_models"):
                pass  # No-op: dropdown reads live list each render

        models = list_ollama_models(base_url)
        if models is None:
            st.caption("Unable to list models. Ensure Ollama is running.")
            models = []
        st.session_state.llm_config["ollama_model"] = st.selectbox(
            "Select Ollama Model", options=(models or ["<none>"]), index=0 if models else 0
        )

    else:  # Remote (OpenRouter)
        st.session_state.llm_config["openrouter_model"] = st.text_input(
            "Model Identifier",
            value=st.session_state.llm_config.get("openrouter_model") or "",
            placeholder="e.g., anthropic/claude-3.5-sonnet",
            help="Enter OpenRouter model ID",
        )
        api_key_masked = "" if not st.session_state.llm_config.get("openrouter_api_key") else mask_secret(
            st.session_state.llm_config.get("openrouter_api_key")
        )
        api_key_input = st.text_input(
            "API Key",
            value="",
            type="password",
            placeholder=(api_key_masked or "sk-..."),
            help="Key is stored only in session and never logged.",
        )
        if api_key_input:
            st.session_state.llm_config["openrouter_api_key"] = api_key_input
        if st.button("Test API Connection", key="openrouter_test_conn"):
            ok, msg = test_openrouter_connection(
                st.session_state.llm_config.get("openrouter_api_key"),
            )
            if ok:
                st.success("OpenRouter reachable")
            else:
                st.error(msg)

    st.markdown("")
    if st.button("Save Config to .env", help="Persist current provider and model settings to .env"):
        try:
            write_env(
                provider=st.session_state.llm_provider,
                ollama_endpoint=st.session_state.llm_config.get("ollama_base_url"),
                ollama_model=st.session_state.llm_config.get("ollama_model"),
                openrouter_model=st.session_state.llm_config.get("openrouter_model"),
                openrouter_api_key=st.session_state.llm_config.get("openrouter_api_key"),
            )
            st.success("Saved to .env")
        except Exception as e:
            st.error(f"Failed to write .env: {e}")


def mask_secret(value: Optional[str]) -> str:
    if not value:
        return ""
    if len(value) <= 8:
        return "*" * len(value)
    return value[:4] + "*" * (len(value) - 8) + value[-4:]


def test_ollama_connection(base_url: str) -> Tuple[bool, str]:
    if requests is None:
        return False, "requests not installed. Run: uv add requests"
    try:
        r = requests.get(base_url.rstrip("/") + "/api/tags", timeout=3)
        if r.status_code == 200:
            return True, "ok"
        return False, f"HTTP {r.status_code}"
    except Exception as e:  # pragma: no cover
        return False, str(e)


def list_ollama_models(base_url: str) -> Optional[List[str]]:
    if requests is None:
        return None
    try:
        r = requests.get(base_url.rstrip("/") + "/api/tags", timeout=3)
        if r.status_code != 200:
            return None
        data = r.json()
        models = [m.get("name") for m in data.get("models", []) if m.get("name")]
        return models
    except Exception:  # pragma: no cover
        return None


def test_openrouter_connection(api_key: Optional[str]) -> Tuple[bool, str]:
    if requests is None:
        return False, "requests not installed. Run: uv add requests"
    if not api_key:
        return False, "API key missing"
    try:
        # Lightweight auth check: list models (may fail on restricted networks)
        r = requests.get(
            "https://openrouter.ai/api/v1/models",
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=5,
        )
        if r.status_code == 200:
            return True, "ok"
        return False, f"HTTP {r.status_code}"
    except Exception as e:  # pragma: no cover
        return False, str(e)


def write_env(
    provider: Optional[str] = None,
    ollama_endpoint: Optional[str] = None,
    ollama_model: Optional[str] = None,
    openrouter_model: Optional[str] = None,
    openrouter_api_key: Optional[str] = None,
) -> None:
    lines: List[str] = []
    if provider:
        lines.append(f"LLM_PROVIDER={provider}")
    if ollama_endpoint:
        lines.append(f"OLLAMA_ENDPOINT={ollama_endpoint}")
    if ollama_model:
        lines.append(f"OLLAMA_MODEL={ollama_model}")
    if openrouter_model:
        lines.append(f"OPENROUTER_MODEL={openrouter_model}")
    if openrouter_api_key:
        lines.append(f"OPENROUTER_API_KEY={openrouter_api_key}")
    if not lines:
        return
    env_path = os.path.join(_project_root(), ".env")
    with open(env_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")


# -------------------------------
# LLM querying + orchestration
# -------------------------------

def llm_query_ollama(base_url: str, model: str, system_prompt: str, user_prompt: str) -> Tuple[bool, str]:
    if requests is None:
        return False, "requests not installed"
    try:
        url = base_url.rstrip("/") + "/api/chat"
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "stream": False,
        }
        r = requests.post(url, json=payload, timeout=60)
        if r.status_code != 200:
            return False, f"HTTP {r.status_code}: {r.text[:200]}"
        data = r.json()
        content = (data.get("message") or {}).get("content") or ""
        return True, content
    except Exception as e:  # pragma: no cover
        return False, str(e)


def llm_query_openrouter(api_key: str, model: str, system_prompt: str, user_prompt: str) -> Tuple[bool, str]:
    if requests is None:
        return False, "requests not installed"
    try:
        url = "https://openrouter.ai/api/v1/chat/completions"
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        }
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        r = requests.post(url, json=payload, headers=headers, timeout=60)
        if r.status_code != 200:
            return False, f"HTTP {r.status_code}: {r.text[:200]}"
        data = r.json()
        content = (data.get("choices", [{}])[0].get("message") or {}).get("content") or ""
        return True, content
    except Exception as e:  # pragma: no cover
        return False, str(e)


def extract_json(text: str) -> Optional[Dict[str, Any]]:
    """Extract first JSON object from a string (handles ```json fences)."""
    try:
        stripped = text.strip()
        if stripped.startswith("```"):
            stripped = "\n".join(
                [line for line in stripped.splitlines() if not line.strip().startswith("```")]
            )
        # Find first { ... } block
        start = stripped.find("{")
        end = stripped.rfind("}")
        if start != -1 and end != -1 and end > start:
            return json.loads(stripped[start : end + 1])
        return json.loads(stripped)
    except Exception:
        return None


def validate_llm_output(level_schema: Dict[str, Any], parsed: Dict[str, Any]) -> Dict[str, Any]:
    """Validate structure of a single-level LLM output.

    Expected keys: decision (str|None), confidence (0-100), fields (dict) optional.
    Only returns values that pass validation. Invalid items are dropped.
    """
    out: Dict[str, Any] = {"decision": None, "confidence": 0, "fields": {}}
    if not isinstance(parsed, dict):
        return out
    decision = parsed.get("decision")
    if isinstance(decision, str):
        out["decision"] = decision
    try:
        conf = int(float(parsed.get("confidence", 0)))
        out["confidence"] = max(0, min(100, conf))
    except Exception:
        pass
    # Fields
    proposed = parsed.get("fields") or {}
    valid_fields: Dict[str, Any] = {}
    if isinstance(proposed, dict):
        schema_fields = {}
        for bucket in ("mandatory", "optional"):
            for fname, ftype in (level_schema.get(bucket) or {}).items():
                schema_fields[fname] = ftype
        for fname, value in proposed.items():
            if fname in schema_fields:
                ftype = schema_fields[fname]
                ok, _ = validate_value(value, ftype)
                if ok:
                    valid_fields[fname] = value
    out["fields"] = valid_fields
    return out


def llm_navigate_hierarchy(model: Dict[str, Any], description: str) -> Tuple[bool, str]:
    """Drive level-by-level decisions using configured LLM provider.

    Updates session_state.form_data, selected_subtypes, and path as it progresses.
    Stops if confidence < 50 at any decision.
    """
    provider = st.session_state.llm_provider
    cfg = st.session_state.llm_config

    system_prompt = (
        "You assist in filling a hierarchical semantic model. "
        "At each level, decide which child type best matches the user's description, "
        "returning strict JSON with keys: decision (string or null), confidence (0-100), fields (object). "
        "Only choose from provided options. If confidence < 50, set decision to null. "
        "Also propose values for fields at the current level when present, respecting types."
    )

    def ask_llm(options: List[str], level_key: str, level_schema: Dict[str, Any]) -> Tuple[bool, Dict[str, Any], str]:
        # Build user prompt
        mand = level_schema.get("mandatory") or {}
        opt = level_schema.get("optional") or {}
        user_prompt = (
            f"User description:\n{description}\n\n"
            f"Current level: {level_key}\n"
            f"Available child options: {options}\n"
            f"Mandatory fields at this level: {list(mand.keys())}\n"
            f"Optional fields at this level: {list(opt.keys())}\n\n"
            "Return JSON: {\"decision\": <one of options or null>, \"confidence\": <0-100>, \"fields\": {<field>: <value>}}"
        )

        if provider == "ollama":
            model_name = cfg.get("ollama_model")
            base_url = cfg.get("ollama_base_url") or "http://localhost:11434"
            if not model_name or model_name == "<none>":
                return False, {}, "No Ollama model selected"
            ok, content = llm_query_ollama(base_url, model_name, system_prompt, user_prompt)
        else:
            api_key = cfg.get("openrouter_api_key")
            model_name = cfg.get("openrouter_model") or ""
            if not api_key or not model_name:
                return False, {}, "OpenRouter model or API key missing"
            ok, content = llm_query_openrouter(api_key, model_name, system_prompt, user_prompt)

        if not ok:
            return False, {}, content
        data = extract_json(content) or {}
        validated = validate_llm_output(level_schema, data)
        return True, validated, "ok"

    # Work from root
    cur_path = ["dcat:Resource"]
    cur_key = cur_path[0]

    # Pre-fill root discriminator if LLM suggests
    while True:
        level_schema = get_level(model, cur_path)
        instances = list((level_schema.get("instances") or {}).keys())
        if not instances:
            break

        with st.status(f"Analyzing level: {cur_key}") as status:
            options_display = ", ".join(instances)
            status.write(f"Options: {options_display}")
            ok, result, msg = ask_llm(instances, cur_key, level_schema)
            if not ok:
                status.update(label=f"LLM error at {cur_key}", state="error")
                return False, msg

            # Apply fields (validated only)
            for fname, val in (result.get("fields") or {}).items():
                st.session_state.form_data[fname] = val
                try:
                    st.session_state.llm_generated_fields.add(fname)
                except Exception:
                    pass

            decision = result.get("decision")
            confidence = int(result.get("confidence") or 0)
            if not decision or confidence < 50:
                # Streamlit status supports only: running, complete, error
                status.update(label=f"Stopped at {cur_key} due to low confidence ({confidence}%)", state="complete")
                st.warning(f"LLM confidence too low ({confidence}%) at level {cur_key}. Please continue manually.")
                break
            if decision not in instances:
                status.update(label=f"Invalid decision '{decision}' at {cur_key}", state="error")
                break

            # Set subtype selection and move deeper
            st.session_state.selected_subtypes[cur_key] = decision

            # Sync possible discriminator enums when applicable (best-effort)
            mand = level_schema.get("mandatory") or {}
            for fname, ftype in mand.items():
                if isinstance(ftype, str) and ftype.startswith("enum["):
                    enum_vals = [v.strip() for v in ftype[5:-1].split(",")]
                    last_part = decision.split(":")[-1]
                    if last_part in enum_vals:
                        st.session_state.form_data[fname] = last_part
                    else:
                        for ev in enum_vals:
                            if ev in last_part:
                                st.session_state.form_data[fname] = ev
                                break

            cur_path.append(decision)
            cur_key = decision
            status.update(label=f"Selected {decision} (confidence {confidence}%). Proceeding...", state="running")

    # Update effective path
    st.session_state.path = cur_path
    return True, "Completed or paused based on confidence"


def llm_sync_selecteds_from_path(path: List[str]) -> None:
    """Ensure selected_subtypes reflects parent->child selections for the given path."""
    if not path:
        return
    for i in range(len(path) - 1):
        parent = path[i]
        child = path[i + 1]
        st.session_state.selected_subtypes[parent] = child


def llm_sync_enums_from_path(model: Dict[str, Any], path: List[str]) -> None:
    """Populate enum discriminator fields along the path so dropdowns reflect selections."""
    if not path:
        return
    for i in range(len(path) - 1):
        parent_path = path[: i + 1]
        child_key = path[i + 1]
        parent_schema = get_level(model, parent_path)
        mand = parent_schema.get("mandatory") or {}
        last_part = child_key.split(":")[-1]
        for fname, ftype in mand.items():
            if isinstance(ftype, str) and ftype.startswith("enum["):
                enum_vals = [v.strip() for v in ftype[5:-1].split(",")]
                if last_part in enum_vals:
                    st.session_state.form_data[fname] = last_part
                else:
                    for ev in enum_vals:
                        if ev in last_part:
                            st.session_state.form_data[fname] = ev
                            break


def collect_all_fields(model: Dict[str, Any], path: List[str]) -> Dict[str, str]:
    fields: Dict[str, str] = {}
    for i in range(len(path)):
        lvl_schema = get_level(model, path[: i + 1])
        for bucket in ("mandatory", "optional"):
            for fname, ftype in (lvl_schema.get(bucket) or {}).items():
                fields[fname] = ftype
    return fields


def llm_extract_all_fields(model: Dict[str, Any], path: List[str], description: str) -> Tuple[bool, str]:
    """Ask the configured LLM to extract values for all fields along the chosen path, then validate/store."""
    provider = st.session_state.llm_provider
    cfg = st.session_state.llm_config
    all_fields = collect_all_fields(model, path)

    fields_spec = ", ".join([f"{k}:{v}" for k, v in all_fields.items()])
    # Emphasize root mandatory fields to encourage LLM to fill them
    root_mand = list((get_level(model, [path[0]]).get("mandatory") or {}).keys())
    system_prompt = (
        "Extract values from the user's description for the provided fields. "
        "Return strict JSON mapping field names to values only. "
        "For the following root mandatory fields always provide your best reasonable estimate (never omit): "
        f"{root_mand}. "
        "For all other fields include values only when confidence is at least 50%. "
        "Respect types: enums must be allowed values; integers, decimals, booleans, URIs, lists."
    )
    user_prompt = (
        f"User description:\n{description}\n\n"
        f"Fields (name:type):\n{fields_spec}\n\n"
        f"Prioritize filling these mandatory root fields if possible: {root_mand}. "
        "If uncertain, provide your best estimate when reasonable. "
        "Output JSON only, no explanations."
    )

    if provider == "ollama":
        model_name = cfg.get("ollama_model")
        base_url = cfg.get("ollama_base_url") or "http://localhost:11434"
        if not model_name or model_name == "<none>":
            return False, "No Ollama model selected"
        ok, content = llm_query_ollama(base_url, model_name, system_prompt, user_prompt)
    else:
        api_key = cfg.get("openrouter_api_key")
        model_name = cfg.get("openrouter_model") or ""
        if not api_key or not model_name:
            return False, "OpenRouter model or API key missing"
        ok, content = llm_query_openrouter(api_key, model_name, system_prompt, user_prompt)

    if not ok:
        return False, content
    parsed = extract_json(content)
    if not isinstance(parsed, dict):
        return False, "Invalid extraction output"

    # Validate and store values
    for fname, value in parsed.items():
        ftype = all_fields.get(fname)
        if not ftype:
            continue
        store_value = value
        if isinstance(value, list) and isinstance(ftype, str) and ftype.startswith("List["):
            # Validate list by converting to comma-separated string
            to_validate = ", ".join([str(v) for v in value])
            ok_val, _ = validate_value(to_validate, ftype)
            if ok_val:
                store_value = value  # keep as list in form data
            else:
                continue
        else:
            ok_val, _ = validate_value(value, ftype)
            if not ok_val:
                continue
        st.session_state.form_data[fname] = store_value
        try:
            st.session_state.llm_generated_fields.add(fname)
        except Exception:
            pass
    # Fill any missing root mandatory fields with safe best-guess defaults
    ensure_root_mandatory_completion(model, path, description)
    return True, "ok"


def ensure_root_mandatory_completion(model: Dict[str, Any], path: List[str], description: str) -> None:
    root_schema = get_level(model, [path[0]])
    mand = root_schema.get("mandatory") or {}
    # Heuristic helpers
    def ensure_text(name: str, value: str) -> None:
        if not _is_value_filled(mand.get(name, "xsd:text"), st.session_state.form_data.get(name)):
            st.session_state.form_data[name] = value

    # dcterms:title
    if "dcterms:title" in mand:
        title = description.strip().split("\n")[0].strip()
        if len(title) > 120:
            title = title[:117].rstrip() + "..."
        if not title:
            last = path[-1].split(":")[-1] if path else "Asset"
            title = f"{last} asset"
        ensure_text("dcterms:title", title)

    # dcterms:type (free text skos:concept) from path last type
    if "dcterms:type" in mand:
        last_type = path[-1].split(":")[-1] if path else "asset"
        ensure_text("dcterms:type", last_type)

    # dcterms:publisher (best guess from capitalized token or 'Unknown')
    if "dcterms:publisher" in mand:
        m = re.search(r"\b([A-Z][a-zA-Z0-9_-]{2,})\b", description)
        publisher = m.group(1) if m else "Unknown"
        ensure_text("dcterms:publisher", publisher)

    # dcterms:license (valid URI, choose a common permissive license as placeholder)
    if "dcterms:license" in mand:
        ensure_text("dcterms:license", "https://creativecommons.org/licenses/by/4.0/")

    # dcterms:identifier (deterministic hash-based id)
    if "dcterms:identifier" in mand:
        digest = hashlib.sha1(description.encode("utf-8")).hexdigest()[:10]
        ensure_text("dcterms:identifier", f"asset-{digest}")

    # dcterms:description (use full description trimmed)
    if "dcterms:description" in mand:
        desc = description.strip()
        if len(desc) > 1000:
            desc = desc[:997].rstrip() + "..."
        ensure_text("dcterms:description", desc)

    # dcat:version (sensible default)
    if "dcat:version" in mand:
        ensure_text("dcat:version", "1.0.0")

    # dcat:keyword (require at least one keyword)
    if "dcat:keyword" in mand and not _is_value_filled("List[xsd:text]", st.session_state.form_data.get("dcat:keyword")):
        # derive simple keywords from description and path
        tokens = [t.lower() for t in re.findall(r"[A-Za-z0-9]+", description) if len(t) >= 3]
        seen = set()
        kw: List[str] = []
        for part in path:
            last = part.split(":")[-1].lower()
            if last not in seen:
                seen.add(last)
                kw.append(last)
        for t in tokens:
            if t not in seen:
                seen.add(t)
                kw.append(t)
            if len(kw) >= 5:
                break
        if kw:
            st.session_state.form_data["dcat:keyword"] = kw

    # dcat:contactPoint (valid URI)
    if "dcat:contactPoint" in mand and not _is_value_filled("xsd:anyUri", st.session_state.form_data.get("dcat:contactPoint")):
        st.session_state.form_data["dcat:contactPoint"] = "mailto:contact@example.com"


# -------------------------------
# Export helpers
# -------------------------------

def build_instance_tree(model: Dict[str, Any], path: List[str], form_data: Dict[str, Any]) -> Dict[str, Any]:
    def node_for(idx: int) -> Dict[str, Any]:
        key = path[idx]
        schema = get_level(model, path[: idx + 1])
        props: Dict[str, Any] = {}
        for bucket in ("mandatory", "optional"):
            for fname, _ in (schema.get(bucket) or {}).items():
                if fname in form_data:
                    props[fname] = form_data[fname]
        node: Dict[str, Any] = {"@type": key, "properties": props}
        if idx + 1 < len(path):
            node["child"] = node_for(idx + 1)
        return node

    return node_for(0)


def main():
    st.set_page_config(page_title="RODEOS Semantic Model UI", layout="wide")
    init_state()

    # Sidebar
    render_sidebar(st.session_state.path)

    # Main content
    st.title("RODEOS Semantic Model UI")
    st.caption("Build semantic model instances via hierarchical, type-aware forms.")
    # Show any success/info messages persisted across reruns
    if st.session_state.get("messages"):
        for msg in st.session_state.messages:
            st.success(msg)
        st.session_state.messages = []

    # Mode selection
    mode_label = st.selectbox(
        "Select Input Mode",
        options=["🤖 LLM-Assisted", "✋ Manual Fill"],
        index=0 if st.session_state.input_mode == "llm" else 1,
        help="LLM-assisted suggests values from your description; manual keeps full control.",
    )
    st.session_state.input_mode = "llm" if mode_label.startswith("🤖") else "manual"

    # LLM input interface
    if st.session_state.input_mode == "llm":
        st.subheader("Describe Your Asset")
        desc = st.text_area(
            "Asset Description",
            value=st.session_state.llm_user_description,
            height=160,
            placeholder=(
                "Describe your asset. Example: 'Industrial AGV robot with laser navigation, "
                "500kg payload, used in automotive manufacturing.' Include as many details as possible."
            ),
        )
        st.session_state.llm_user_description = desc
        st.caption(f"{len(desc)}/2000 characters")
        run_llm = st.button("Generate Form Fields", disabled=not bool(desc.strip()))
        if run_llm:
            ok, msg = llm_navigate_hierarchy(st.session_state.model, desc)
            if not ok:
                st.error(f"LLM processing failed: {msg}")
            else:
                # Sync enums and selections to reflect path
                llm_sync_selecteds_from_path(st.session_state.path)
                llm_sync_enums_from_path(st.session_state.model, st.session_state.path)
                ok2, msg2 = llm_extract_all_fields(st.session_state.model, st.session_state.path, desc)
                if not ok2:
                    st.warning(f"Extraction partial/failed: {msg2}")
                st.session_state.messages.append("LLM processing complete. You may review and adjust values below.")
                # Signal one-time widget state priming on next render
                st.session_state._llm_sync_pending = True
                st.rerun()

    # Phase 1-4: Dynamic hierarchical form rendering
    model = st.session_state.model
    path = st.session_state.path
    root_schema = get_level(model, path)

    # Render from the current path root recursively
    render_level(get_level(model, [path[0]]), 0, path[0], [path[0]])

    # Update path based on selected_subtypes chain
    new_path = [path[0]]
    # Walk selections deterministically
    cur_key = path[0]
    while True:
        schema = get_level(model, new_path)
        selected = st.session_state.selected_subtypes.get(cur_key)
        if not selected:
            break
        new_path.append(selected)
        cur_key = selected

    if new_path != path:
        st.session_state.path = new_path

    # Clear the one-shot widget sync flag after rendering
    if st.session_state.get("_llm_sync_pending"):
        st.session_state._llm_sync_pending = False

    st.divider()

    # Validation summary and export controls
    valid, errors = is_form_valid(model, st.session_state.path, st.session_state.form_data)
    mand_fields = collect_mandatory_fields(model, st.session_state.path)
    filled_count = 0
    for fname, ftype in mand_fields:
        val = st.session_state.form_data.get(fname)
        if ftype == "xsd:boolean":
            if val is not None:
                filled_count += 1
        else:
            ok, _ = validate_value(val, ftype)
            if ok:
                filled_count += 1
    total_count = max(len(mand_fields), 1)
    pct = int((filled_count / total_count) * 100)
    cols = st.columns([0.6, 0.4])
    with cols[0]:
        st.subheader("Validation")
        st.progress(pct, text=f"Completion: {pct}% ({filled_count}/{total_count})")
        if valid:
            st.success("All required fields are complete.")
        else:
            st.error("Please complete the required fields below:")
            for e in errors:
                st.write(f"- {e}")

        if st.button("Reset Form"):
            st.session_state.form_data = {}
            st.session_state.selected_subtypes = {}
            st.session_state.path = ["dcat:Resource"]
            st.rerun()

    with cols[1]:
        st.subheader("JSON Preview")
        instance = build_instance_tree(model, st.session_state.path, st.session_state.form_data)
        st.json(instance, expanded=False)

        export_bytes = json.dumps(instance, indent=2).encode("utf-8")
        st.download_button(
            "Download Semantic Model (JSON)",
            data=export_bytes,
            file_name="semantic_model_instance.json",
            mime="application/json",
            disabled=not valid,
        )

        if st.button("Generate Model", disabled=not valid, type="primary"):
            try:
                os.makedirs(os.path.dirname(GENERATED_MODEL_PATH), exist_ok=True)
                with open(GENERATED_MODEL_PATH, "w", encoding="utf-8") as f:
                    json.dump(instance, f, indent=2, ensure_ascii=False)
                st.success(f"Model written to {GENERATED_MODEL_PATH}")
            except Exception as e:
                st.error(f"Failed to write model: {e}")


if __name__ == "__main__":
    main()
