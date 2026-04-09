// src/Test2.js
import React, { useState, useEffect } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { Modal } from "bootstrap";
import 'bootstrap/dist/css/bootstrap.min.css';
import '../../css/adminlte.css'
import '../../css/custom.css'
import '../../App.css'
import EDGE_CONNECTOR from "../../config.js"

const SearchKits = () => {
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadSearchResults();
  }, []);

  function getTextFillColor(category){
      if (!category) return ''; // handle null/undefined
      const cat = category.toLowerCase();

      switch (cat) {
          case 'software':
              return 'text-bg-success';
          case 'hardware':
              return 'text-bg-primary';
          case 'dataset':
              return 'text-bg-warning';
          case 'service':
              return 'text-bg-danger';
          default:
              return ''; // no special border
      }
  }

  async function loadSearchResults(query="") {
      const response = await fetch(`${EDGE_CONNECTOR.ADDRESS}:${EDGE_CONNECTOR.PORT}/federatedcatalog/${query}`);
      const tbody = document.getElementById("searchTable");

      tbody.innerHTML = ""; // clear previous rows
    
      if (!response.ok) {
        console.error("Failed to load assets");
        return;
      }
    
      const catalogs = await response.json();

      catalogs.forEach(catalog => {
          // extract data
          let datasets = catalog["dcat:dataset"];
          if (!datasets) return;
          if (!Array.isArray(datasets)) datasets = [datasets]; // normalize single object to array
          if (datasets.length === 0) return;

          const provider_id = catalog["dspace:participantId"];
          const originator = catalog["originator"];
          
          datasets.forEach(asset => {
              if (!("kit_type" in asset)) return;
              asset.originator = originator;
              asset.provider_id = provider_id;
              
              const icon = asset.icon ? `<img src="${asset.icon}" alt="Icon" style="width:100%; height:100%; object-fit:cover;">`
                              : `<i class="bi bi-box" style="font-size: 40px; display: inline-block; width: 60px; height: 60px; line-height: 60px; text-align: center;"></i>`;
              const kit_name = asset["kit_name"];
              const asset_id = asset["id"];
              const kit_type = asset["kit_type"];
              const version = asset["version"];
              const description = asset["description"];
              const asset_type = asset.asset_type || '-';
              const offer_type = asset["offerType"] || '-';
              const semantic_category = asset.semantic_model?.category || '-';
              const semantic_model = asset.semantic_model?.model || '-';
              const policy = asset["odrl:hasPolicy"];

              const tr = document.createElement("tr");
              tr.innerHTML = `
                  <td class="text-center">
                      <div style="width: 60px; height: 60px; overflow: hidden; margin: 0 auto;">
                      ${icon}
                      </div>
                  </td>

                  <td>
                  <div class="info-box-text" style="text-align: center;">${kit_name}</div>
                  <div class="text-muted small" style="text-align: center;">${version}</div>
                  <div class="text-muted small" style="text-align: center;">${kit_type}/ ${asset_type} / ${offer_type}</div>
                  </td>
                  
                  <td>
                  <div class="text-center">
                      <span class="badge ${getTextFillColor(semantic_category)}">${semantic_category}</span>
                  </div>
                  <div class="text-muted small" style="text-align: center;">${semantic_model}</div>
                  </td>
          
                  <!-- Provider -->
                  <td class="text-center">${provider_id}</td>
          
                  <!-- Description -->
                  <td>
                      <span class="truncate-two-lines">
                          ${description}
                      </span>
                  </td>
          
                  <!-- Actions -->
                  <td class="text-center align-middle">
                  <div class="d-flex justify-content-center align-items-center gap-2">
                      <button class="btn btn-sm btn-primary rounded-pill view-btn" data-id="${asset.id}">
                      <i class="bi bi-info-circle"></i>
                      </button>
                      <button class="btn btn-sm btn-success rounded-pill download-btn" data-id="${asset.id}">
                      <i class="bi bi-cloud-arrow-down"></i>
                      </button>
                      <button class="btn btn-sm btn-dark rounded-pill send-btn" data-id="${asset.id}">
                      <i class="bi bi-send"></i>
                      </button>
                  </div>
                  </td>
              `;

              const viewBtn = tr.querySelector(".view-btn");
              const downloadBtn = tr.querySelector(".download-btn");
              const sendBtn = tr.querySelector(".send-btn");
              viewBtn.addEventListener("click", () => {
                  console.log(`Asset info view button clicked: ${asset.id}`);
                  document.getElementById('viewJsonModalTitle').textContent = `Semantic Model of ${asset.id}`;

                  const prettyJson = JSON.stringify(asset, null, 2);
                  document.getElementById('jsonViewer').textContent = prettyJson;    
                  const modal = new Modal(document.getElementById('viewJsonModal'));
                  modal.show();
              });

              downloadBtn.addEventListener("click", async () => {
                  console.log(`download button clicked: ${JSON.stringify(asset)}`);
                  const payload = {
                      provider_id: provider_id,
                      connector_url: originator,
                      kit_name: asset_id,
                      overwrite: true
                  };
                  if (asset.method === "POST") {
                      console.log("TODO: request body must be provided")
                      payload.payload = asset.request_body;
                  }
                  const resp = await fetch(`${EDGE_CONNECTOR.ADDRESS}:${EDGE_CONNECTOR.PORT}/download/kit`, {
                      method: 'POST',
                      headers: {
                          'Content-Type': 'application/json'
                      },
                      body: JSON.stringify(payload)
                  });
                  console.log(`Download request sent out ${JSON.stringify(payload)}`)
                  if (!resp.ok) {
                      alert("Failed: ");
                      return;
                  }
                  alert(`Download Completed`);
              });

              sendBtn.addEventListener("click", async () => {
                  alert("Not yet implemented")
              });

              tbody.appendChild(tr);
          });
      });
  }

  const handleSubmit = (e) => {
    e.preventDefault();               // stop page reload
    loadSearchResults(searchQuery);   // pass the typed text
  };

  return (
    <div>
<div className="app-content-header">
  <div className="container-fluid">
    <div className="row">
      <div className="col-sm-6">
        <h3 className="mb-0">Search KITs</h3>
      </div>
    </div>
  </div>
</div>
  
<div className="app-content">
  <div className="container-fluid">
    <div className="row mb-3">
        <div className="col-md-12">
            <form id="search-form" className="d-flex" onSubmit={handleSubmit}>
                <div className="search">
                  <span className="search-icon material-symbols-outlined">search</span>

                  <input
                    id="search-input"
                    className="search-input"
                    type="search"
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />

                  <button type="submit" className="btn btn-outline-secondary ms-2 rounded-pill">
                    <i className="bi bi-arrow-right-circle"></i>
                  </button>
                    <button id="ai_assist" type="button" className="btn btn-outline-secondary ms-2 rounded-pill" data-bs-toggle="tooltip" data-bs-placement="top" title="AI assistance">
                        <i className="bi bi-robot"></i>
                    </button>
                </div>
            </form>
        </div>
    </div>

    <div className="card mb-4">
      <div className="card-body table-responsive p-0">
        <table className="table table-striped align-middle">
          <thead>
            <tr>
              <th className="text-center" style={{ width: '100px' }}>Icon</th>
              <th className="text-center" style={{ width: '150px', paddingLeft: '10px' }}>KIT Name</th>
              <th className="text-center" style={{ width: '150px' }}>Semantic Model</th>
              <th className="text-center" style={{ width: '200px' }}>Provider</th>
              <th style={{width: 'auto'}}>Description</th>
              <th className="text-center" style={{ width: '120px' }}>Actions</th>
            </tr>
          </thead>

          <tbody id="searchTable">
          </tbody>

        </table>
      </div>
    </div>
  </div>
</div>

<div className="modal fade" id="viewJsonModal" tabIndex={-1}>
  <div className="modal-dialog modal-lg modal-dialog-scrollable">
    <div className="modal-content">

      <div className="modal-header">
        <h5 className="modal-title" id="viewJsonModalTitle">
          Asset JSON
        </h5>
        <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
      </div>

      <div className="modal-body">
        <pre id="jsonViewer"
             style={{ 
  whiteSpace: 'pre-wrap', 
  wordBreak: 'break-word', 
  maxHeight: '70vh' 
}}>
        </pre>
      </div>

      <div className="modal-footer">
        <button className="btn btn-secondary" data-bs-dismiss="modal">
          Close
        </button>
      </div>

    </div>
  </div>
</div>
</div>
);
};

export default SearchKits;
