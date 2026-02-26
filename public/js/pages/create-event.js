document.addEventListener("DOMContentLoaded", () => {
  const app = window.CampusSponsor;
  const session = app.requireAuth(["club"]);
  if (!session) {
    return;
  }

  const tiersContainer = document.getElementById("tiersContainer");
  const addTierButton = document.getElementById("addTierButton");
  const form = document.getElementById("eventForm");
  const notice = document.getElementById("eventNotice");

  function tierTemplate(index, presetName = "Bronze") {
    return `
      <div class="tier-card" data-tier-card>
        <div class="form-grid">
          <div class="field">
            <label>Tier Name</label>
            <select data-tier-name>
              <option value="Bronze" ${presetName === "Bronze" ? "selected" : ""}>Bronze</option>
              <option value="Silver" ${presetName === "Silver" ? "selected" : ""}>Silver</option>
              <option value="Gold" ${presetName === "Gold" ? "selected" : ""}>Gold</option>
              <option value="Platinum" ${presetName === "Platinum" ? "selected" : ""}>Platinum</option>
            </select>
          </div>
          <div class="field">
            <label>Price</label>
            <input data-tier-price type="number" min="0" placeholder="1000" />
          </div>
          <div class="field full">
            <label>Benefits</label>
            <textarea data-tier-benefits placeholder="Stage shoutout, logo placement, booth access"></textarea>
          </div>
          <div class="field full">
            <label>Deliverables</label>
            <textarea data-tier-deliverables placeholder="Logo on poster, social mentions, on-ground branding"></textarea>
          </div>
          <div class="field full">
            <button class="button-danger ${index < 1 ? "hidden" : ""}" type="button" data-remove-tier>Remove Tier</button>
          </div>
        </div>
      </div>
    `;
  }

  function bindRemoveButtons() {
    tiersContainer.querySelectorAll("[data-remove-tier]").forEach((button) => {
      button.addEventListener("click", () => {
        button.closest("[data-tier-card]").remove();
      });
    });
  }

  function addTier(name) {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = tierTemplate(tiersContainer.children.length, name);
    tiersContainer.appendChild(wrapper.firstElementChild);
    bindRemoveButtons();
  }

  ["Bronze", "Silver"].forEach(addTier);
  addTierButton.addEventListener("click", () => addTier("Gold"));

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    app.clearNotice(notice);

    try {
      const formData = new FormData(form);
      const tiers = Array.from(tiersContainer.querySelectorAll("[data-tier-card]")).map((card) => ({
        name: card.querySelector("[data-tier-name]").value,
        price: card.querySelector("[data-tier-price]").value,
        benefits: card.querySelector("[data-tier-benefits]").value,
        deliverables: card.querySelector("[data-tier-deliverables]").value
      }));

      formData.append("tiers", JSON.stringify(tiers));

      const data = await app.request("/api/events/create", {
        method: "POST",
        body: formData
      });

      app.setNotice(notice, data.message, "success");
      window.setTimeout(() => {
        window.location.href = `/event-details.html?id=${data.event.id}`;
      }, 700);
    } catch (error) {
      app.setNotice(notice, error.message, "error");
    }
  });
});
