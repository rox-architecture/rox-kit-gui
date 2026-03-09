// src/Test2.js
import React, { useState, useEffect } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../../css/adminlte.css'
import '../../css/custom.css'
import '../../App.css'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'

const emptyRow = () => ({
  id: crypto.randomUUID(),
  stage: "",
  provider_id: "",
  connector_url: "",
  kit_name: "",
  action: "download",
});

const RunCompositeKit = () => {
  const [rows, setRows] = useState([emptyRow()]);

  const addRow = () => {
    setRows((prev) => [...prev, emptyRow()]);
  };

  const removeRow = (id) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const updateRow = (id, field, value) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const handleStageChange = (id, value) => {
    // keep only digits, no leading zeros, no "0"
    let v = value.replace(/[^\d]/g, "");
    if (v.length > 1) v = v.replace(/^0+/, "");
    if (v === "0") v = "";
    updateRow(id, "stage", v);
  };

  return (
    <div>
      <div className="app-content-header">
        <div className="container-fluid">
          <div className="row">
            <div className="col-sm-6">
              <h3 className="mb-0">Provide / Composite KIT</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="app-content">
        <div className="container-fluid">
          {/* 👇 TABLE GOES HERE */}
          <div className="card">
            <div className="card-body">
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
                      {/* Stage */}
                      <td>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="1,2,3..."
                          value={row.stage}
                          onChange={(e) =>
                            handleStageChange(row.id, e.target.value)
                          }
                        />
                      </td>

                      {/* KITs */}
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
                              onChange={(e) =>
                                updateRow(row.id, "provider_id", e.target.value)
                              }
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
                              onChange={(e) =>
                                updateRow(
                                  row.id,
                                  "connector_url",
                                  e.target.value
                                )
                              }
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
                              onChange={(e) =>
                                updateRow(row.id, "kit_name", e.target.value)
                              }
                            />
                          </div>
                        </div>
                      </td>

                      {/* Action */}
                      <td>
                        <div className="d-flex flex-column gap-2">
                          <select
                            className="form-select"
                            value={row.action}
                            onChange={(e) =>
                              updateRow(row.id, "action", e.target.value)
                            }
                          >
                            <option value="download">Download</option>
                            <option value="read">Read</option>
                            <option value="send-to">Send-To</option>
                          </select>

                          <button
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

              <div className="d-flex gap-2">
                <button className="btn btn-success" onClick={addRow}>
                  Add row (KIT)
                </button>
              </div>
            </div>
          </div>
          {/* 👆 END TABLE */}
        </div>
      </div>
    </div>
  );
};


export default RunCompositeKit;