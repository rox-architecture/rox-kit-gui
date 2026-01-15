async function loadContracts(page = 0, limit = 1000) {
    const container = document.getElementById('cardsContainer');

    try {
        const STATUS_URL = `${EDGE_CONNECTOR.ADDRESS}:${EDGE_CONNECTOR.PORT}/contracts?page=${page}&limit=${limit}`;
        const response = await fetch(STATUS_URL);

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
        const contract_id = item['@id'];
        const access_policy_id = item['accessPolicyId']
        const contract_policy_id = item['contractPolicyId']
        const asset_id = item.assetsSelector.operandRight;

        // Create card HTML
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
                KIT: ${asset_id}
            </div>

            <div class="info-box-actions">
                <div class="row g-1">
                <div class="col-4">
                    <button class="btn btn-sm btn-outline-primary w-100 asset-btn">
                    <i class="bi bi-info-circle"></i>
                    </button>
                </div>
                <div class="col-4">
                    <button class="btn btn-sm btn-outline-dark w-100 policy-btn">
                    <i class="bi bi-shield-exclamation"></i>
                    </button>
                </div>
                <div class="col-4">
                    <button class="btn btn-sm btn-outline-danger w-100 remove-btn">
                    <i class="bi bi-trash"></i>
                    </button>
                </div>
                </div>
            </div>
            </div>
        `;

        card.querySelector('.asset-btn').addEventListener('click', async () => {
            // Set modal title
            document.getElementById('viewJsonModalTitle').textContent =
            `Associated KIT: ${asset_id}`;

            // get the asset data
            const URL_ASSET = `${EDGE_CONNECTOR.ADDRESS}:${EDGE_CONNECTOR.PORT}/assets/${asset_id}`;
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
                document.getElementById('jsonViewer').textContent = prettyJson;

                // Show modal
                const modal = new bootstrap.Modal(document.getElementById('viewJsonModal'));
                modal.show();
            } catch (error) {
                console.error("Asset retreival failed:", error);
            }
        });
        card.querySelector('.policy-btn').addEventListener('click', async () => {
            document.getElementById('viewJsonModalTitle').textContent =
            `Use Policy: ${contract_policy_id}`;

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
                document.getElementById('jsonViewer').textContent = prettyJson;

                // Show modal
                const modal = new bootstrap.Modal(document.getElementById('viewJsonModal'));
                modal.show();
            } catch (error) {
                console.error("Asset retreival failed:", error);
            }
        });
        card.querySelector('.remove-btn').addEventListener('click', async () => {
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

            // Some DELETE endpoints return no content (204)
            let result = null;
            if (response.status !== 204) {
                result = await response.json();
            }

            console.log("Delete success:", result);
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
