document.addEventListener("DOMContentLoaded", async () => {
  const app = window.CampusSponsor;
  const eventId = new URLSearchParams(window.location.search).get("id");
  const session = app.getSession();
  const hero = document.getElementById("eventHero");
  const overview = document.getElementById("eventOverview");
  const tiersList = document.getElementById("tiersList");
  const collaborationList = document.getElementById("collaborationList");
  const mediaGallery = document.getElementById("mediaGallery");
  const requestSection = document.getElementById("requestSection");
  const requestForm = document.getElementById("requestForm");
  const requestNotice = document.getElementById("requestNotice");
  const mediaSection = document.getElementById("mediaSection");
  const mediaForm = document.getElementById("mediaForm");
  const mediaNotice = document.getElementById("mediaNotice");
  const tierSelect = document.getElementById("tierId");
  const mediaCollaborationSelect = document.getElementById("mediaCollaborationId");

  let currentEvent = null;
  let currentCollaborations = [];

  if (!eventId) {
    hero.innerHTML = `<div class="hero-grid"><div><h1>Event not found.</h1><p>Add an event id to the URL.</p></div></div>`;
    return;
  }

  function renderHero(event) {
    hero.innerHTML = `
      <div class="hero-grid">
        <div>
          <span class="eyebrow">${app.escapeHtml(event.category)}</span>
          <h1>${app.escapeHtml(event.title)}</h1>
          <p>${app.escapeHtml(event.description)}</p>
          <div class="list-meta">
            <span>${app.formatDate(event.eventDate)}</span>
            <span>${app.escapeHtml(event.location)}</span>
            <span>${app.escapeHtml(event.clubName)}</span>
            ${app.statusBadge(event.approvalStatus)}
          </div>
        </div>
        <div class="hero-aside">
          <strong>Event assets</strong>
          <div class="stack mt-1">
            ${event.posterUrl ? `<img class="event-cover" src="${app.escapeHtml(event.posterUrl)}" alt="${app.escapeHtml(event.title)}" />` : "<div class='empty-state'>No poster uploaded yet.</div>"}
            <div class="inline-actions">
              ${event.brochureUrl ? `<a class="button-soft" href="${app.escapeHtml(event.brochureUrl)}" target="_blank" rel="noreferrer">Open Brochure</a>` : ""}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderOverview(event) {
    overview.innerHTML = `
      <div class="stack">
        <div class="list-item">
          <h4>${app.escapeHtml(event.clubName)}</h4>
          <div class="list-meta">
            <span>${app.escapeHtml(event.collegeName || "Unknown campus")}</span>
            <span>${event.audience} expected attendees</span>
          </div>
        </div>
        <div class="list-item">
          <h4>Venue</h4>
          <p class="small">${app.escapeHtml(event.venue)}</p>
        </div>
        <div class="list-item">
          <h4>Collaboration snapshot</h4>
          <div class="list-meta">
            ${(event.collaborationStats || [])
              .map((item) => `${app.escapeHtml(item.status)}: ${item.count}`)
              .join(" | ") || "No requests yet"}
          </div>
        </div>
      </div>
    `;
  }

  function renderTiers(event) {
    tiersList.innerHTML = event.tiers
      .map(
        (tier) => `
          <article class="tier-card">
            <div class="list-meta">
              <span class="tag">${app.escapeHtml(tier.name)}</span>
              <strong>${app.formatCurrency(tier.price)}</strong>
            </div>
            <div class="tier-row">
              <strong>Benefits</strong>
              <p class="small">${app.escapeHtml(tier.benefits)}</p>
            </div>
            <div>
              <strong>Deliverables</strong>
              <p class="small">${app.escapeHtml(tier.deliverables)}</p>
            </div>
          </article>
        `
      )
      .join("");

    tierSelect.innerHTML = event.tiers
      .map((tier) => `<option value="${tier.id}">${app.escapeHtml(tier.name)} - ${app.formatCurrency(tier.price)}</option>`)
      .join("");
  }

  function renderCollaborations() {
    if (!session) {
      collaborationList.innerHTML = app.renderEmpty("Login to view collaboration activity", "Role-aware collaboration details appear here after sign in.");
      return;
    }

    const rows =
      session.user.role === "admin"
        ? currentCollaborations
        : currentCollaborations.filter((item) => {
            if (session.user.role === "club") {
              return item.clubId === session.user.id;
            }
            if (session.user.role === "company") {
              return item.companyId === session.user.id;
            }
            return false;
          });

    if (!rows.length) {
      collaborationList.innerHTML = app.renderEmpty("No collaboration activity", "Requests for this event will appear here.");
      return;
    }

    collaborationList.innerHTML = rows
      .map(
        (item) => `
          <article class="list-item">
            <h4>${app.escapeHtml(item.companyName || item.clubName || "Collaboration")}</h4>
            <div class="list-meta">
              <span>${app.escapeHtml(item.tierName)}</span>
              <span>${app.formatCurrency(item.tierPrice)}</span>
              ${app.statusBadge(item.status)}
            </div>
            <p class="small">${app.escapeHtml(item.message || item.negotiationNote || "No message attached.")}</p>
            <div class="inline-actions mt-08">
              <a class="button-soft" href="/chat.html?collab=${item.id}">Open Chat</a>
              ${session.user.role === "club" || session.user.role === "admin"
                ? `
                    <button class="button-soft" type="button" data-respond="${item.id}" data-status="accepted">Accept</button>
                    <button class="button-soft" type="button" data-respond="${item.id}" data-status="negotiating">Negotiate</button>
                    <button class="button-danger" type="button" data-respond="${item.id}" data-status="rejected">Reject</button>
                  `
                : ""}
            </div>
          </article>
        `
      )
      .join("");

    collaborationList.querySelectorAll("[data-respond]").forEach((button) => {
      button.addEventListener("click", async () => {
        const note = button.dataset.status === "negotiating" ? window.prompt("Add a negotiation note:", "") || "" : "";
        await app.request(`/api/collab/respond/${button.dataset.respond}`, {
          method: "PUT",
          body: JSON.stringify({
            status: button.dataset.status,
            note
          })
        });
        await loadCollaborations();
      });
    });
  }

  function renderMedia(mediaItems) {
    if (!mediaItems.length) {
      mediaGallery.innerHTML = app.renderEmpty("No media uploaded", "Accepted collaborators and clubs can upload proof media here.");
      return;
    }

    mediaGallery.innerHTML = mediaItems
      .map(
        (item) => `
          <article class="media-card">
            ${item.type === "image" ? `<img class="event-cover" src="${app.escapeHtml(item.url)}" alt="${app.escapeHtml(item.title || item.originalName)}" />` : ""}
            <div class="body">
              <strong>${app.escapeHtml(item.title || item.originalName)}</strong>
              <div class="list-meta">
                <span>${app.escapeHtml(item.type)}</span>
                <span>${app.formatDate(item.createdAt)}</span>
              </div>
              <div class="inline-actions mt-08">
                <a class="button-soft" href="${app.escapeHtml(item.url)}" target="_blank" rel="noreferrer">Open File</a>
              </div>
            </div>
          </article>
        `
      )
      .join("");
  }

  async function loadCollaborations() {
    if (!session) {
      renderCollaborations();
      return;
    }

    try {
      const { collaborations } = await app.request("/api/collab/all");
      currentCollaborations = collaborations.filter((item) => String(item.eventId) === String(eventId));
      renderCollaborations();

      const canUpload =
        session.user.role === "admin" ||
        session.user.id === currentEvent.clubId ||
        currentCollaborations.some(
          (item) =>
            (item.companyId === session.user.id || item.clubId === session.user.id) &&
            ["accepted", "negotiating"].includes(item.status)
        );

      mediaSection.classList.toggle("hidden", !canUpload);
      if (canUpload) {
        const eligibleCollaborations = currentCollaborations.filter((item) =>
          ["accepted", "negotiating"].includes(item.status)
        );
        const options = eligibleCollaborations.length
          ? eligibleCollaborations
              .map((item) => `<option value="${item.id}">${app.escapeHtml(item.companyName || item.clubName)} - ${app.escapeHtml(item.tierName)}</option>`)
              .join("")
          : "";
        mediaCollaborationSelect.innerHTML = `<option value="">General event media</option>${options}`;
      }
    } catch (error) {
      collaborationList.innerHTML = app.renderEmpty("Unable to load collaborations", error.message);
    }
  }

  async function loadMedia() {
    if (!session) {
      mediaGallery.innerHTML = app.renderEmpty("Login required", "Event proof media is available to authenticated collaborators.");
      return;
    }

    try {
      const { media } = await app.request(`/api/media/${eventId}`);
      renderMedia(media);
    } catch (error) {
      mediaGallery.innerHTML = app.renderEmpty("Media locked", error.message);
    }
  }

  requestForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    app.clearNotice(requestNotice);

    try {
      await app.request("/api/collab/request", {
        method: "POST",
        body: JSON.stringify({
          eventId,
          tierId: tierSelect.value,
          message: requestForm.message.value
        })
      });
      app.setNotice(requestNotice, "Request sent successfully.", "success");
      await loadCollaborations();
    } catch (error) {
      app.setNotice(requestNotice, error.message, "error");
    }
  });

  mediaForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    app.clearNotice(mediaNotice);

    try {
      const formData = new FormData(mediaForm);
      formData.append("eventId", eventId);
      await app.request("/api/media/upload", {
        method: "POST",
        body: formData
      });
      app.setNotice(mediaNotice, "Media uploaded successfully.", "success");
      mediaForm.reset();
      await loadMedia();
    } catch (error) {
      app.setNotice(mediaNotice, error.message, "error");
    }
  });

  try {
    const { event } = await app.request(`/api/events/${eventId}`);
    currentEvent = event;
    renderHero(event);
    renderOverview(event);
    renderTiers(event);

    const canRequest = session?.user?.role === "company" && event.approvalStatus === "approved";
    requestSection.classList.toggle("hidden", !canRequest);

    await loadCollaborations();
    await loadMedia();
  } catch (error) {
    hero.innerHTML = `<div class="hero-grid"><div><h1>Unable to load event.</h1><p>${app.escapeHtml(error.message)}</p></div></div>`;
  }
});
