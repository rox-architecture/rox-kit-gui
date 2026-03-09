async function loadNegotiations() {
    try {
        const response = await fetch(`${EDGE_CONNECTOR.ADDRESS}:${EDGE_CONNECTOR.PORT}/negotiations`);        
        if (!response.ok) {
            console.error("Failed to load negotiations");
            return;
        }
        const data = await response.json();
        console.log(`negotiation: ${JSON.stringify(data)}`)
    
        const tbody = document.getElementById("negotiationTable");
        tbody.innerHTML = ""; // clear previous rows

        data.forEach(item => {
            // Extract relevant info from the JSON
            const nego_id = item['@id'];
            const provider_id = item['counterPartyId'];
            const created_at = item['createdAt'];
            const time = new Date(created_at).toISOString().replace("T", ", ").slice(0, 17);
            const asset_id = item['assetId'];

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <!-- Col1 Asset ID -->
                <td>
                <span class="info-box-text">${asset_id}</span>
                </td>
                
                <!-- Col2 Negotiation ID -->
                <td class="text-center">${nego_id}</td>
        
                <!-- Col3 Provider ID -->
                <td class="text-center">${provider_id}</td>
        
                <!-- Col4 Created Time -->
                <td class="text-center">${time}</td>

                <!-- Actions -->
                <td class="text-center align-middle">
                <div class="d-flex justify-content-center align-items-center gap-2">
                    <button class="btn btn-sm btn-danger rounded-pill delete-btn" data-id="${asset_id}">
                    <i class="bi bi-trash"></i>
                    </button>
                </div>
                </td>
            `;
            const deleteBtn = tr.querySelector(".delete-btn");

            deleteBtn.addEventListener("click", async () => {
                console.log(`Nego delete button clicked: ${nego_id}`);
                const ENDPOINT_URL = `${EDGE_CONNECTOR.ADDRESS}:${EDGE_CONNECTOR.PORT}/negotiation/${nego_id}`;
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
                    alert("Deleted successfully");
                } catch (error) {
                console.error("Delete failed:", error);
                    alert("Failed to delete");
                }
            });
            tbody.appendChild(tr);
        });

    } catch (error) {

        console.error("Failed to fetch negotiation data:", error);
    }
}