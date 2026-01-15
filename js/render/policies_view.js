function attachPolicyContainerEvents(container) {
  if (container.dataset.listenerAttached === "true") return;

  container.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-lte-toggle='card-collapse']");
    if (!btn) return;

    const card = btn.closest(".card");
    if (!card) return;

    card.classList.toggle("collapsed-card");
  });

  container.dataset.listenerAttached = "true";
}

async function loadPolicies(page = 0, limit = 100) {
  try {
    const response = await fetch(`${EDGE_CONNECTOR.ADDRESS}:${EDGE_CONNECTOR.PORT}/policies?page=${page}&limit=${limit}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const policies = await response.json();

    const container = document.getElementById("policy-container");
    attachPolicyContainerEvents(container)
     
    policies.forEach((policy) => {
      const createdAt = new Date(policy.createdAt).toLocaleString();
      const policyId = policy["@id"] || "Unknown ID";
      const policyBody = policy.policy ? JSON.stringify(policy.policy, null, 2) : "No policy body available";

      // Column wrapper for grid layout
      const col = document.createElement("div");
      col.className = "col-md-3 mb-4"; // add margin-bottom for spacing

      // Card
      const card = document.createElement("div");
      card.className = "card card-primary collapsed-card";

      // Card header
      const cardHeader = document.createElement("div");
      cardHeader.className = "card-header";
      cardHeader.innerHTML = `
        <h3 class="card-title">${policyId}</h3>
        <div class="card-tools">
          <button type="button" class="btn btn-tool" data-lte-toggle="card-collapse">
            <i data-lte-icon="expand" class="bi bi-plus-lg"></i>
            <i data-lte-icon="collapse" class="bi bi-dash-lg"></i>
          </button>
        </div>
      `;
      card.appendChild(cardHeader);

      // Card body
      const cardBody = document.createElement("div");
      cardBody.className = "card-body";

      const createdAtP = document.createElement("p");
      createdAtP.innerHTML = `<strong>Created At:</strong> ${createdAt}`;
      cardBody.appendChild(createdAtP);

      const pre = document.createElement("pre");
      pre.className = "policy-body";
      pre.style.cssText = "background:#f8f9fa; padding:0.5rem; border-radius:0.25rem; overflow-x:auto;";
      pre.textContent = policyBody; // safely display JSON
      cardBody.appendChild(pre);

      card.appendChild(cardBody);

      // Append card to column, column to container
      col.appendChild(card);
      container.appendChild(col);
    });

    // Optional: call LTE.init() if needed
    if (window.LTE) {
      window.LTE.init();
    }

  } catch (err) {
    console.error("Error loading policies:", err);
    alert("Failed to load policies: " + err.message);
  }
}
