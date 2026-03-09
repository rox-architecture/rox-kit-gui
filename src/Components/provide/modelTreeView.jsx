import '../../css/custom.css'

import { useState } from "react";

function TreeNode({ node, level, selectedID, onSelect }) {
  const title = node.label ?? node.text ?? node.name ?? "(no title)";
  const hasChildren = Array.isArray(node.children) && node.children.length > 0;

  const [open, setOpen] = useState(node.defaultOpen ?? false);
  const isSelected = selectedID === node.id;

  const indentStyle = { paddingLeft: level * 16 };

  const caretClass = open ? "fas fa-chevron-down" : "fas fa-chevron-right";
  const folderClass = open ? "fas fa-folder-open" : "fas fa-folder";
  const leafClass = node.icon ?? "fas fa-file";

  return (
    <div style={indentStyle}>
      <div
        className={
          "d-flex align-items-center gap-2 py-1 rounded " +
          (isSelected ? "bg-primary bg-opacity-10" : "")
        }
      >
        <button
          type="button"
          className="btn btn-sm p-0"
          style={{ width: 18 }}
          onClick={() => hasChildren && setOpen((v) => !v)}
          aria-label={hasChildren ? "toggle" : undefined}
          disabled={!hasChildren}
        >
          {hasChildren ? <i className={caretClass} /> : null}
        </button>

        <i className={hasChildren ? folderClass : leafClass} />

        <button
          type="button"
          className={
            "btn btn-sm p-0 text-start flex-grow-1 " +
            (isSelected ? "fw-bold text-primary" : "")
          }
          onClick={() => {
            if (hasChildren) setOpen((v) => !v);
            onSelect(node);
          }}
        >
          {title}
        </button>
      </div>

      {hasChildren && open && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              selectedID={selectedID}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SimpleTree({ data, selectedID, onSelect }) {
  return (
    <div>
      {data.map((n) => (
        <TreeNode
          key={n.id}
          node={n}
          level={0}
          selectedID={selectedID}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}