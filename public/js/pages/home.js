document.addEventListener("DOMContentLoaded", async () => {
  const { request, escapeHtml, formatDate, formatCurrency, renderEmpty } = window.CampusSponsor;
  const target = document.querySelector("[data-recent-events]");

  try {
    const { events } = await request("/api/events/all");
    const items = events.slice(0, 3);

    if (!items.length) {
      target.innerHTML = renderEmpty("No approved events yet", "Once clubs publish and admins approve events, they will appear here.");
      return;
    }

    target.innerHTML = items
      .map(
        (event) => `
          <article class="card">
            <span class="tag">${escapeHtml(event.category)}</span>
            <h3>${escapeHtml(event.title)}</h3>
            <p class="section-copy">${escapeHtml(event.description.slice(0, 120))}...</p>
            <div class="list-meta">
              <span>${formatDate(event.eventDate)}</span>
              <span>${escapeHtml(event.location)}</span>
              <span>${escapeHtml(event.clubName)}</span>
            </div>
            <div class="list-meta">
              <span>${event.tiers.length} tiers</span>
              <span>From ${formatCurrency(event.tiers[0]?.price || 0)}</span>
            </div>
            <div class="inline-actions mt-1">
              <a class="button-soft" href="/event-details.html?id=${event.id}">View Details</a>
            </div>
          </article>
        `
      )
      .join("");
  } catch (error) {
    target.innerHTML = renderEmpty("Unable to load events", error.message);
  }
});
