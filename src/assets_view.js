let selectedAssetId = null;

function truncateText(text, maxLength = 15) {
    if (!text) return '';
    return text.length > maxLength ? text.slice(0, maxLength) + '…' : text;
}  

// Global event handlers (top-level)
function initContractSubmitHandler() {
    const btn = document.getElementById('submitContractBtn');

    if (btn.dataset.bound === 'true') return; // prevent double binding
    btn.dataset.bound = 'true';

    btn.addEventListener('click', async () => {
        const name = document.getElementById('contractName').value.trim();
        const policyId = document.getElementById('policyId').value.trim();

        if (!name || !policyId) {
        alert('Please fill in both fields');
        return;
        }

        const payload = {
        asset_id: selectedAssetId,
        contract_id: name,
        policy_id: policyId
        };

        try {
        const response = await fetch(
            `${EDGE_CONNECTOR.ADDRESS}:${EDGE_CONNECTOR.PORT}/contract`,
            {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        alert('Contract created successfully');
        bootstrap.Modal
            .getInstance(document.getElementById('contractModal'))
            .hide();

        } catch (err) {
        console.error(err);
        alert('Failed to create contract');
        }
    });
}

function getBorderClass(category){
    if (!category) return ''; // handle null/undefined
    const cat = category.toLowerCase();

    switch (cat) {
        case 'software':
        return 'info-box-border-software';
        case 'hardware':
        return 'info-box-border-hardware';
        case 'dataset':
        return 'info-box-border-dataset';
        case 'service':
        return 'info-box-border-service';
        default:
        return ''; // no special border
    }
}



async function loadAssets(page = 0, limit = 1000) {
    try {
        const STATUS_URL = `${EDGE_CONNECTOR.ADDRESS}:${EDGE_CONNECTOR.PORT}/assets?page=${page}&limit=${limit}`;
        const response = await fetch(STATUS_URL, {
        method: "GET",
        headers: {
            "Accept": "application/json"
        }
        });

        if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
        }

        const data = await response.json();
        console.log("Received JSON:", data);

        // Dynamically create cards
        const container = document.getElementById('cardsContainer');
        container.innerHTML = ''; // clear previous cards

        data.forEach(item => {
        // Extract relevant info from the JSON
        const id = item['@id'];
        const version = item.properties?.version || '&nbsp;';

        const kitType = item.properties?.kit_type;
        const offerType = item.properties?.offerType;

        const kitString = kitType
                            ? offerType
                            ? `${kitType}/${offerType}`  // both exist
                            : `${kitType}`               // only kit_type exists
                            : '&nbsp;';                     // kit_type missing

        const category = item.properties?.semantic_model?.category;
        const semanticString = item.properties?.semantic_model
                                ? `${category}/${item.properties.semantic_model.model}`
                                : '&nbsp;';

        const semanticName = item.properties?.semantic_model?.name || 'N/A';
        const thumbnail = item.properties?.icon
        const picture = thumbnail ? `<img src="${thumbnail}" alt="Thumbnail" style="width:100%; height:100%; object-fit:cover; border-radius: 4px;">`
                    : `<i class="bi bi-box"></i>`

        // Create card HTML
        const card = document.createElement('div');
        card.className = "col-12 col-sm-6 col-md-3";
        card.innerHTML = `
            <div class="info-box ${getBorderClass(category)}">
            <div class="info-box-top">
                <div class="info-box-icon">
                ${picture}
                </div>
                <div class="info-box-header-text">
                <span class="info-box-title">${truncateText(id, 15)}</span>
                <span class="info-box-version">${version}</span>
                <span class="info-box-text">${truncateText(kitString,15)}</span>
                <span class="info-box-text">${truncateText(semanticString,15)}</span>
                </div>
            </div>
            <div class="info-box-actions">
                <div class="row g-1">
                <div class="col-4">
                    <button class="btn btn-sm btn-outline-primary w-100 view-btn">
                    <i class="bi bi-info-circle"></i>
                    </button>
                </div>
                <div class="col-4">
                    <button class="btn btn-sm btn-outline-dark w-100 contract-btn">
                    <i class="bi bi-file-earmark-text"></i>
                    </button>
                </div>
                <div class="col-4">
                    <button class="btn btn-sm btn-outline-danger w-100 delete-btn">
                    <i class="bi bi-trash"></i>
                    </button>
                </div>
                </div>
            </div>
            </div>
        `;

        card.querySelector('.view-btn').addEventListener('click', () => {
            // Set modal title
            document.getElementById('viewJsonModalTitle').textContent = `Asset JSON: ${id}`;

            // Pretty-print JSON
            const jsonTextarea = document.getElementById('jsonViewer');
            jsonTextarea.value = JSON.stringify(item, null, 2);

            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('viewJsonModal'));
            modal.show();
        });
        card.querySelector('.contract-btn').addEventListener('click', () => {
            selectedAssetId = id;

            // reset inputs
            document.getElementById('contractName').value = '';
            document.getElementById('policyId').value = '';

            document.getElementById('contractModalTitle').textContent = `Create Contract: ${id}`;

            initContractSubmitHandler();

            const modal = new bootstrap.Modal(
                document.getElementById('contractModal')
            );
            modal.show();
        });
        card.querySelector('.delete-btn').addEventListener('click', async () => {
            const ENDPOINT_URL = `${EDGE_CONNECTOR.ADDRESS}:${EDGE_CONNECTOR.PORT}/assets/${id}`;
            alert(`Deleting ${id}`);
            try {
            const response = await fetch(ENDPOINT_URL, {
                method: "DELETE",
                headers: {
                "Accept": "application/json"
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            // Some DELETE endpoints return no content (204)
            let result = null;
            if (response.status !== 204) {
                result = await response.json();
            }

            console.log("Delete success:", result);
            alert("Asset deleted successfully");
            card.remove();
            } catch (error) {
            console.error("Delete failed:", error);
            alert("Failed to delete asset");
            }
        });

        container.appendChild(card);
        });

        document.getElementById('editJsonBtn').addEventListener('click', () => {
            // Show warning confirmation modal
            const confirmModal = new bootstrap.Modal(document.getElementById('confirmEditModal'));
            confirmModal.show();
        });

        document.getElementById('confirmYes').addEventListener('click', async () => {
            const jsonData = document.getElementById('jsonViewer').value; // Read textarea
            
            try {
                // Parse the JSON
                const parsedData = JSON.parse(jsonData);

                // Create a new object with renamed keys
                const transformedData = {
                    ...parsedData,                 // copy all top-level keys
                    asset_id: parsedData['@id'],  // rename @id to asset_id
                    context: parsedData['@context'] // rename @context to context
                };

                // Remove the old keys
                delete transformedData['@id'];
                delete transformedData['@context'];
                delete transformedData['@type'];

                const payload = JSON.stringify(transformedData, null, 2);
                const response = await fetch(`${EDGE_CONNECTOR.ADDRESS}:${EDGE_CONNECTOR.PORT}/asset`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: payload
                });
        
                if (!response.ok) throw new Error(`HTTP error ${response.status}`);
                alert("JSON updated successfully!");

                // Optionally close the modals
                bootstrap.Modal.getInstance(document.getElementById('confirmEditModal')).hide();
                bootstrap.Modal.getInstance(document.getElementById('viewJsonModal')).hide();
            } catch (error) {
                console.error("Failed to update JSON:", error);
                alert("Failed to update JSON: " + error.message);
            }
        });

        return data;

    } catch (error) {

        console.error("Failed to fetch KIT data:", error);
    }



}
