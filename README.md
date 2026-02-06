## How To Run

### KIT GUI
```
python -m http.server 5500
```
Then access `localhost:5500` in your browser.

**python 3.8 or higher version** should be fine.

### RODEOS Semantic Model UI

Interactive Streamlit UI for creating semantic model instances of robotics assets. Supports LLM-assisted form filling (Ollama or OpenRouter) and manual mode.

**Setup:**

1. Install [uv](https://docs.astral.sh/uv/) (fast Python package manager):
   ```bash
   curl -LsSf https://astral.sh/uv/install.sh | sh
   ```

2. Create venv and install dependencies:
   ```bash
   uv sync
   ```

3. Configure `.env` in the project root:
   ```bash
   # Local LLM (Ollama)
   LLM_PROVIDER=ollama
   OLLAMA_ENDPOINT=http://localhost:11434
   OLLAMA_MODEL=llama3

   # Or remote LLM (OpenRouter)
   LLM_PROVIDER=openrouter
   OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
   OPENROUTER_API_KEY=sk-or-v1-...
   ```

4. Run:
   ```bash
   uv run streamlit run rodeos/ui.py
   ```
   Opens at `http://localhost:8501`.

For details on the semantic model structure, see [rodeos/README.md](./rodeos/README.md).

## Tutorials

For how to use `KIT GUI`, check the guide menu when you run `KIT GUI`.

Alternatively,

- Check [home.md](./home.md) for the overview
- Check [static/md/setup.md](./static/md/setup.md) for enabling `Edge-Connector` (backend).
- Check [static/md/providing-kits.md](./static/md/providing-kits.md) for KIT creation and management.
- Check [static/md/consuming-kits.md](./static/md/consuming-kits.md) for KIT search and access.