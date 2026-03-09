import React, { useEffect, useRef, useState } from 'react';
import { Modal } from 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../../css/adminlte.css';
import '../../css/custom.css';
import '../../App.css';
import EDGE_CONNECTOR from '../../config.js';

const MyKits = () => {
  const [assets, setAssets] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [jsonViewerText, setJsonViewerText] = useState('');
  const [contractName, setContractName] = useState('');
  const [policyId, setPolicyId] = useState('');

  const viewJsonModalRef = useRef(null);
  const contractModalRef = useRef(null);
  const confirmEditModalRef = useRef(null);

  function truncateText(text, maxLength = 15) {
    if (!text) return '';
    return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
  }

  function getBorderClass(category) {
    if (!category) return '';
    switch (category.toLowerCase()) {
      case 'software':
        return 'info-box-border-software';
      case 'hardware':
        return 'info-box-border-hardware';
      case 'dataset':
        return 'info-box-border-dataset';
      case 'service':
        return 'info-box-border-service';
      default:
        return '';
    }
  }

  function cleanupModalArtifacts() {
    document.body.classList.remove('modal-open');
    document.body.style.removeProperty('padding-right');
    document.querySelectorAll('.modal-backdrop').forEach((el) => el.remove());
  }

  async function loadAssets(page = 0, limit = 1000) {
    try {
      const url = `${EDGE_CONNECTOR.ADDRESS}:${EDGE_CONNECTOR.PORT}/assets?page=${page}&limit=${limit}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();
      console.log('Received JSON:', data);
      setAssets(data);
    } catch (error) {
      console.error('Failed to fetch KIT data:', error);
    }
  }

  function openViewModal(asset) {
    setSelectedAsset(asset);
    setJsonViewerText(JSON.stringify(asset, null, 2));
    viewJsonModalRef.current?.show();
  }

  function openContractModal(asset) {
    setSelectedAsset(asset);
    setContractName('');
    setPolicyId('');
    contractModalRef.current?.show();
  }

  function openConfirmEditModal() {
    confirmEditModalRef.current?.show();
  }

  async function handleDelete(assetId) {
    const endpointUrl = `${EDGE_CONNECTOR.ADDRESS}:${EDGE_CONNECTOR.PORT}/assets/${assetId}`;

    if (!window.confirm(`Delete ${assetId}?`)) {
      return;
    }

    try {
      const response = await fetch(endpointUrl, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      if (response.status !== 204) {
        await response.json();
      }

      alert('Asset deleted successfully');
      setAssets((prev) => prev.filter((item) => item['@id'] !== assetId));
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete asset');
    }
  }

  async function handleContractSubmit() {
    const trimmedContractName = contractName.trim();
    const trimmedPolicyId = policyId.trim();

    if (!trimmedContractName || !trimmedPolicyId) {
      alert('Please fill in both fields');
      return;
    }

    if (!selectedAsset?.['@id']) {
      alert('No asset selected');
      return;
    }

    const payload = {
      asset_id: selectedAsset['@id'],
      contract_id: trimmedContractName,
      policy_id: trimmedPolicyId
    };

    try {
      const response = await fetch(
        `${EDGE_CONNECTOR.ADDRESS}:${EDGE_CONNECTOR.PORT}/contract`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      alert('Contract created successfully');
      contractModalRef.current?.hide();
    } catch (error) {
      console.error(error);
      alert('Failed to create contract');
    }
  }

  async function handleConfirmEdit() {
    try {
      const parsedData = JSON.parse(jsonViewerText);

      const transformedData = {
        ...parsedData,
        asset_id: parsedData['@id'],
        context: parsedData['@context']
      };

      delete transformedData['@id'];
      delete transformedData['@context'];
      delete transformedData['@type'];

      const response = await fetch(
        `${EDGE_CONNECTOR.ADDRESS}:${EDGE_CONNECTOR.PORT}/asset`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(transformedData, null, 2)
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      alert('JSON updated successfully!');
      confirmEditModalRef.current?.hide();
      viewJsonModalRef.current?.hide();

      await loadAssets();
    } catch (error) {
      console.error('Failed to update JSON:', error);
      alert(`Failed to update JSON: ${error.message}`);
    }
  }

  useEffect(() => {
    const viewEl = document.getElementById('viewJsonModal');
    const contractEl = document.getElementById('contractModal');
    const confirmEl = document.getElementById('confirmEditModal');

    if (viewEl) {
      viewJsonModalRef.current = Modal.getOrCreateInstance(viewEl);
      viewEl.addEventListener('hidden.bs.modal', cleanupModalArtifacts);
    }

    if (contractEl) {
      contractModalRef.current = Modal.getOrCreateInstance(contractEl);
      contractEl.addEventListener('hidden.bs.modal', cleanupModalArtifacts);
    }

    if (confirmEl) {
      confirmEditModalRef.current = Modal.getOrCreateInstance(confirmEl);
      confirmEl.addEventListener('hidden.bs.modal', cleanupModalArtifacts);
    }

    loadAssets();

    return () => {
      if (viewEl) {
        viewEl.removeEventListener('hidden.bs.modal', cleanupModalArtifacts);
      }
      if (contractEl) {
        contractEl.removeEventListener('hidden.bs.modal', cleanupModalArtifacts);
      }
      if (confirmEl) {
        confirmEl.removeEventListener('hidden.bs.modal', cleanupModalArtifacts);
      }

      cleanupModalArtifacts();
    };
  }, []);

  return (
    <div>
      <div className="app-content-header">
        <div className="container-fluid">
          <div className="row">
            <div className="col-sm-6">
              <h3 className="mb-0">My KITs (Assets)</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="app-content">
        <div className="container-fluid">
          <div className="row">
            {assets.map((item) => {
              const id = item['@id'];
              const version = item.properties?.version || '\u00A0';
              const kitType = item.properties?.kit_type;
              const offerType = item.properties?.offerType;
              const category = item.properties?.semantic_model?.category;
              const semanticModel = item.properties?.semantic_model?.model;
              const thumbnail = item.properties?.icon;

              const kitString = kitType
                ? offerType
                  ? `${kitType}/${offerType}`
                  : kitType
                : '\u00A0';

              const semanticString = semanticModel
                ? `${category}/${semanticModel}`
                : '\u00A0';

              return (
                <div key={id} className="col-12 col-sm-6 col-md-3">
                  <div className={`info-box ${getBorderClass(category)}`}>
                    <div className="info-box-top">
                      <div className="info-box-icon">
                        {thumbnail ? (
                          <img
                            src={thumbnail}
                            alt="Thumbnail"
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              borderRadius: '4px'
                            }}
                          />
                        ) : (
                          <i className="bi bi-box"></i>
                        )}
                      </div>

                      <div className="info-box-header-text">
                        <span className="info-box-title">{truncateText(id, 15)}</span>
                        <span className="info-box-version">{version}</span>
                        <span className="info-box-text">{truncateText(kitString, 15)}</span>
                        <span className="info-box-text">{truncateText(semanticString, 15)}</span>
                      </div>
                    </div>

                    <div className="info-box-actions">
                      <div className="row g-1">
                        <div className="col-4">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary w-100 view-btn"
                            onClick={() => openViewModal(item)}
                          >
                            <i className="bi bi-info-circle"></i>
                          </button>
                        </div>

                        <div className="col-4">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-dark w-100 contract-btn"
                            onClick={() => openContractModal(item)}
                          >
                            <i className="bi bi-file-earmark-text"></i>
                          </button>
                        </div>

                        <div className="col-4">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger w-100 delete-btn"
                            onClick={() => handleDelete(id)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="modal fade" id="contractModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 id="contractModalTitle" className="modal-title">
                {selectedAsset ? `Create Contract: ${selectedAsset['@id']}` : 'Create Contract'}
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>

            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Contract Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={contractName}
                  onChange={(e) => setContractName(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Policy ID</label>
                <input
                  type="text"
                  className="form-control"
                  value={policyId}
                  onChange={(e) => setPolicyId(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" data-bs-dismiss="modal" type="button">
                Cancel
              </button>
              <button className="btn btn-primary" type="button" onClick={handleContractSubmit}>
                Submit
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="modal fade" id="viewJsonModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-lg modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                {selectedAsset ? `Asset JSON: ${selectedAsset['@id']}` : 'Asset JSON'}
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>

            <div className="modal-body">
              <textarea
                className="form-control"
                value={jsonViewerText}
                onChange={(e) => setJsonViewerText(e.target.value)}
                style={{
                  height: '70vh',
                  fontFamily: 'monospace',
                  whiteSpace: 'pre',
                  overflow: 'auto'
                }}
              />
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-warning" onClick={openConfirmEditModal}>
                Edit
              </button>
              <button className="btn btn-secondary" data-bs-dismiss="modal" type="button">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="modal fade" id="confirmEditModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Warning</h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              Editing may cause unexpected errors. Are you sure you want to proceed?
            </div>
            <div className="modal-footer">
              <button type="button" id="confirmYes" className="btn btn-danger" onClick={handleConfirmEdit}>
                Yes
              </button>
              <button className="btn btn-secondary" data-bs-dismiss="modal" type="button">
                No
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyKits;