import React, { useEffect, useRef } from 'react';
import { Modal } from "bootstrap";
import 'bootstrap/dist/css/bootstrap.min.css';
import '../../css/adminlte.css';
import '../../css/custom.css';
import '../../App.css';
import EDGE_CONNECTOR from "../../config.js";

const Contracts = () => {
  const viewJsonModalRef = useRef(null);

  useEffect(() => {
    const modalEl = document.getElementById('viewJsonModal');

    if (modalEl) {
      viewJsonModalRef.current = Modal.getOrCreateInstance(modalEl);

      modalEl.addEventListener('hidden.bs.modal', cleanupModalArtifacts);
    }

    loadContracts();

    return () => {
      if (modalEl) {
        modalEl.removeEventListener('hidden.bs.modal', cleanupModalArtifacts);
      }
      cleanupModalArtifacts();
    };
  }, []);

  function cleanupModalArtifacts() {
    document.body.classList.remove('modal-open');
    document.body.style.removeProperty('padding-right');
    document.querySelectorAll('.modal-backdrop').forEach((el) => el.remove());
  }

  function truncateText(text, maxLength = 15) {
    if (!text) return '';
    return text.length > maxLength ? text.slice(0, maxLength) + '…' : text;
  }

  async function loadContracts(page = 0, limit = 1000) {
    try {
      const STATUS_URL = `${EDGE_CONNECTOR.ADDRESS}:${EDGE_CONNECTOR.PORT}/contracts?page=${page}&limit=${limit}`;
      const response = await fetch(STATUS_URL);

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();
      console.log("Received JSON:", data);

      const container = document.getElementById('cardsContainer');
      if (!container) return;

      container.innerHTML = '';

      data.forEach(item => {
        const contract_id = item['@id'];
        const access_policy_id = item['accessPolicyId'];
        const contract_policy_id = item['contractPolicyId'];
        const asset_id = item.assetsSelector?.operandRight;

        const card = document.createElement('div');
        card.className = "col-12 col-sm-6 col-md-3";
        card.innerHTML = `
          <div class="info-box">
            <div class="info-box-top">
              <div class="info-box-icon">
                <i class="bi bi-box"></i>
              </div>
              <div class="info-box-header-text">
                <span class="info-box-title">${truncateText(contract_id, 15)}</span>
                <span class="info-box-text">Read: ${truncateText(access_policy_id, 15)}</span>
                <span class="info-box-text">Use: ${truncateText(contract_policy_id, 15)}</span>
              </div>
            </div>

            <div class="info-box-subtitle">
              KIT: ${asset_id || ''}
            </div>

            <div class="info-box-actions">
              <div class="row g-1">
                <div class="col-4">
                  <button type="button" class="btn btn-sm btn-outline-primary w-100 asset-btn">
                    <i class="bi bi-info-circle"></i>
                  </button>
                </div>
                <div class="col-4">
                  <button type="button" class="btn btn-sm btn-outline-dark w-100 policy-btn">
                    <i class="bi bi-shield-exclamation"></i>
                  </button>
                </div>
                <div class="col-4">
                  <button type="button" class="btn btn-sm btn-outline-danger w-100 remove-btn">
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        `;

        card.querySelector('.asset-btn')?.addEventListener('click', async () => {
          const titleEl = document.getElementById('viewJsonModalTitle');
          const viewerEl = document.getElementById('jsonViewer');

          if (titleEl) {
            titleEl.textContent = `Associated KIT: ${asset_id}`;
          }

          const URL_ASSET = `${EDGE_CONNECTOR.ADDRESS}:${EDGE_CONNECTOR.PORT}/assets/${encodeURIComponent(asset_id)}`;;

          try {
            const response = await fetch(URL_ASSET, {
              method: "GET",
              headers: {
                "Accept": "application/json"
              }
            });

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            const prettyJson = JSON.stringify(data, null, 2);

            if (viewerEl) {
              viewerEl.textContent = prettyJson;
            }

            viewJsonModalRef.current?.show();
          } catch (error) {
            console.error("Asset retrieval failed:", error);
            alert("Failed to retrieve asset");
          }
        });

        card.querySelector('.policy-btn')?.addEventListener('click', async () => {
          const titleEl = document.getElementById('viewJsonModalTitle');
          const viewerEl = document.getElementById('jsonViewer');

          if (titleEl) {
            titleEl.textContent = `Use Policy: ${contract_policy_id}`;
          }

          const URL_POLICY = `${EDGE_CONNECTOR.ADDRESS}:${EDGE_CONNECTOR.PORT}/policy/${contract_policy_id}`;

          try {
            const response = await fetch(URL_POLICY, {
              method: "GET",
              headers: {
                "Accept": "application/json"
              }
            });

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            const prettyJson = JSON.stringify(data, null, 2);

            if (viewerEl) {
              viewerEl.textContent = prettyJson;
            }

            viewJsonModalRef.current?.show();
          } catch (error) {
            console.error("Policy retrieval failed:", error);
            alert("Failed to retrieve policy");
          }
        });

        card.querySelector('.remove-btn')?.addEventListener('click', async () => {
          const URL_DELETE = `${EDGE_CONNECTOR.ADDRESS}:${EDGE_CONNECTOR.PORT}/contract/${contract_id}`;

          try {
            const response = await fetch(URL_DELETE, {
              method: "DELETE",
              headers: {
                "Accept": "application/json"
              }
            });

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}`);
            }

            if (response.status !== 204) {
              await response.json();
            }

            alert("Contract deleted successfully");
            card.remove();
          } catch (error) {
            console.error("Delete failed:", error);
            alert("Failed to delete contract");
          }
        });

        container.appendChild(card);
      });

      return data;
    } catch (error) {
      console.error("Failed to fetch KIT data:", error);
    }
  }

  return (
    <div>
      <div className="app-content-header">
        <div className="container-fluid">
          <div className="row">
            <div className="col-sm-6">
              <h3 className="mb-0">Contracts (Offers)</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="app-content">
        <div className="container-fluid">
          <div id="cardsContainer" className="row"></div>
        </div>
      </div>

      <div className="modal fade" id="viewJsonModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-lg modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="viewJsonModalTitle">
                Asset JSON
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>

            <div className="modal-body">
              <pre
                id="jsonViewer"
                style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: '70vh' }}
              />
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" data-bs-dismiss="modal" type="button">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contracts;