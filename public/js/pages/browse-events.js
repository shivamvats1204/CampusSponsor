document.addEventListener("DOMContentLoaded", async () => {
  const app = window.CampusSponsor;
  const grid = document.querySelector("[data-events-grid]");
  const form = document.getElementById("filterForm");
  const resetButton = document.getElementById("resetFilters");
  const notice = document.getElementById("browseNotice");

  function renderEvents(events) {
    if (!events.length) {
      grid.innerHTML = app.renderEmpty("No matching events", "Try adjusting the filters or come back after more events are approved.");
      return;
    }

    grid.innerHTML = events
      .map(
        (event) => `
          <article class="card">
            ${event.posterUrl ? `<img class="event-cover" src="${app.escapeHtml(event.posterUrl)}" alt="${app.escapeHtml(event.title)}" />` : ""}
            <div class="card-body-stack">
              <span class="tag">${app.escapeHtml(event.category)}</span>
              <h3>${app.escapeHtml(event.title)}</h3>
              <p class="section-copy">${app.escapeHtml(event.description.slice(0, 140))}...</p>
              <div class="list-meta">
                <span>${app.formatDate(event.eventDate)}</span>
                <span>${app.escapeHtml(event.location)}</span>
                <span>${event.audience} expected</span>
              </div>
              <div class="list-meta">
                <span>${app.escapeHtml(event.clubName)}</span>
                <span>${event.tiers.length} tiers</span>
              </div>
              <div class="inline-actions mt-1">
                <a class="button-soft" href="/event-details.html?id=${event.id}">View Details</a>
              </div>
            </div>
          </article>
        `
      )
      .join("");
  }

  async function loadEvents() {
    app.clearNotice(notice);

    try {
      const params = new URLSearchParams();
      const formData = new FormData(form);
      formData.forEach((value, key) => {
        if (value) {
          params.set(key, value);
        }
      });

      const queryString = params.toString() ? `?${params.toString()}` : "";
      const { events } = await app.request(`/api/events/all${queryString}`);
      renderEvents(events);
    } catch (error) {
      app.setNotice(notice, error.message, "error");
    }
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    loadEvents();
  });

  resetButton.addEventListener("click", () => {
    form.reset();
    loadEvents();
  });

  loadEvents();
});
