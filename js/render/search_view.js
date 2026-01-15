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


function getAllOffers(originator, asset_id, federatedcatalog){
    let results = [];
    for (const catalog of federatedcatalog){
        if (catalog["originator"] !== originator){
            continue;
        }
        
        let datasets = catalog["dcat:dataset"];
        if (!Array.isArray(datasets)){
            datasets = [datasets];
        }
        
        for (const dataset of datasets){
            if (dataset["id"] !== asset_id){
                continue;
            }
            console.log(`I am here ${originator}`);
            const policies = dataset["odrl:hasPolicy"];
            if (!policies) continue;

            let read_policy = null;
            let use_policy = null;

            if (policies.length === 1) {
                read_policy = policies[0]["@id"];
                use_policy = policies[0]["@id"];
            } else if (policies.length >= 2) {
                read_policy = policies[0]["@id"];
                use_policy = policies[1]["@id"];
            }

            results.push({
                asset_id,
                read_policy,
                use_policy
            });
        }
    }
    return results;
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
        const datasets = catalog["dcat:dataset"];
        if (!datasets || datasets.length === 0) { // if no offer in the catalog
            return; 
        }

        const provider_id = catalog["dspace:participantId"];
        const originator = catalog["originator"];
    
        datasets.forEach(asset => {
            if (!("kit_type" in asset)) return;

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
            viewBtn.addEventListener("click", () => {
                console.log(`Asset info view button clicked: ${asset.id}`);
                document.getElementById('viewJsonModalTitle').textContent = `Semantic Model of ${asset.id}`;

                const prettyJson = JSON.stringify(asset, null, 2);
                document.getElementById('jsonViewer').textContent = prettyJson;    
                const modal = new bootstrap.Modal(document.getElementById('viewJsonModal'));
                modal.show();
            });

            downloadBtn.addEventListener("click", async () => {
                console.log(`download button clicked: ${JSON.stringify(asset)}`);
                const payload = {
                    provider_id: provider_id,
                    connector_url: originator,
                    asset_id: asset_id,
                    policy: policy[0],
                    asset_type: asset_type,
                };
                if (asset.method === "POST") {
                    console.log("TODO: request body must be provided")
                    payload.payload = asset.request_body;
                }
                const resp = await fetch(`${EDGE_CONNECTOR.ADDRESS}:${EDGE_CONNECTOR.PORT}/http/transfer`, {
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
                alert(`Response: ${JSON.stringify(resp)}`);
            });
            tbody.appendChild(tr);
        });
    });
}