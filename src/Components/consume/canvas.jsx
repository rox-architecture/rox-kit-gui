import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../css/adminlte.css";
import "../../css/custom.css";
import "../../App.css";
import EDGE_CONNECTOR from "../../config.js"

const emptyRow = () => ({
  id: crypto.randomUUID(),
  stage: "",
  provider_id: "",
  connector_url: "",
  kit_name: "",
  action: "download",
});

const Canvas = () => {
  const [rows, setRows] = useState([emptyRow()]);
  const [canvasName, setCanvasName] = useState("");

  const addRow = () => setRows((prev) => [...prev, emptyRow()]);
  const removeRow = (id) => setRows((prev) => prev.filter((r) => r.id !== id));
  const updateRow = (id, field, value) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));

  const handleStageChange = (id, value) => {
    let v = value.replace(/[^\d]/g, "");
    if (v.length > 1) v = v.replace(/^0+/, "");
    if (v === "0") v = "";
    updateRow(id, "stage", v);
  };

  // Build JSON in the requested format
  const buildSequencePayload = () => {
    const sequence = {};

    rows.forEach((r) => {
      const stage = (r.stage || "").trim();
      if (!stage) return;

      if (!sequence[stage]) sequence[stage] = [];

      sequence[stage].push({
        kit_name: r.kit_name,
        provider_id: r.provider_id,
        connector_url: r.connector_url,
        action: r.action,
      });
    });

    const sortedSequence = Object.fromEntries(
      Object.entries(sequence).sort(([a], [b]) => Number(a) - Number(b))
    );

    return {
      metadata: {
        kit_name: canvasName
      },
      sequence: sortedSequence,
    };
  };

  // "Execute" action
  const handleExecute = () => {
    const payload = buildSequencePayload();
    const STATUS_URL = `${EDGE_CONNECTOR.ADDRESS}:${EDGE_CONNECTOR.PORT}/run/compositekit`;
    console.log("Execute payload:", payload);
    alert(JSON.stringify(payload, null, 2));

    const response = fetch(STATUS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

    if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
    }

    const data = response.json();
    console.log("Received JSON:", data);

    // await fetch("/your-endpoint", { method:"POST", headers:{...}, body: JSON.stringify(payload) })
  };

  return (
    <div>
      <div className="app-content-header">
        <div className="container-fluid">
          <div className="row">
            <div className="col-sm-6">
              <h3 className="mb-0">Composite KIT / Canvas</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="app-content">
        <div className="container-fluid">
          <div className="card">
            <div className="card-body">

              <div className="mb-3">
                <label className="form-label fw-semibold">
                  Composite KIT Name
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter composite KIT name..."
                  value={canvasName}
                  onChange={(e) => setCanvasName(e.target.value)}
                />
              </div>

              <table className="table table-bordered align-middle">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: "120px" }}>Stage</th>
                    <th>KITs</th>
                    <th style={{ width: "180px" }}>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="1,2,3..."
                          value={row.stage}
                          onChange={(e) => handleStageChange(row.id, e.target.value)}
                        />
                      </td>

                      <td>
                        <div className="d-flex flex-column gap-2">
                          <div className="d-flex align-items-center gap-2">
                            <label className="fw-semibold" style={{ width: 110 }}>
                              Provider ID
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              value={row.provider_id}
                              onChange={(e) => updateRow(row.id, "provider_id", e.target.value)}
                            />
                          </div>

                          <div className="d-flex align-items-center gap-2">
                            <label className="fw-semibold" style={{ width: 110 }}>
                              Connector URL
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              value={row.connector_url}
                              onChange={(e) => updateRow(row.id, "connector_url", e.target.value)}
                            />
                          </div>

                          <div className="d-flex align-items-center gap-2">
                            <label className="fw-semibold" style={{ width: 110 }}>
                              KIT Name
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              value={row.kit_name}
                              onChange={(e) => updateRow(row.id, "kit_name", e.target.value)}
                            />
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="d-flex flex-column gap-2">
                          <select
                            className="form-select"
                            value={row.action}
                            onChange={(e) => updateRow(row.id, "action", e.target.value)}
                          >
                            <option value="download">Download</option>
                            <option value="read">Read</option>
                            <option value="send-to">Send-To</option>
                          </select>

                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => removeRow(row.id)}
                          >
                            Remove row
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Buttons: left "Add row", right "Execute" */}
              <div className="d-flex justify-content-between align-items-center">
                <button type="button" className="btn btn-success" onClick={addRow}>
                  Add row (KIT)
                </button>

                <button type="button" className="btn btn-primary" onClick={handleExecute}>
                  Execute
                </button>
              </div>
            </div>
          </div>

          {/* Optional: show preview JSON */}
          {/* <pre className="mt-3">{JSON.stringify(buildSequencePayload(), null, 2)}</pre> */}
        </div>
      </div>
    </div>
  );
};

export default Canvas;