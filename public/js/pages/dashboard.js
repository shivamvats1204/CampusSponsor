document.addEventListener("DOMContentLoaded", async () => {
  const app = window.CampusSponsor;
  const session = app.requireAuth();
  if (!session) {
    return;
  }

  const hero = document.querySelector("[data-dashboard-hero]");
  const summaryTarget = document.querySelector("[data-summary]");
  const primaryTitle = document.querySelector("[data-primary-title]");
  const secondaryTitle = document.querySelector("[data-secondary-title]");
  const primaryList = document.querySelector("[data-primary-list]");
  const secondaryList = document.querySelector("[data-secondary-list]");
  const notice = document.getElementById("dashboardNotice");

  function metricCard(label, value) {
    return `<article class="card"><div class="small muted">${app.escapeHtml(label)}</div><div class="metric-value">${app.escapeHtml(value)}</div></article>`;
  }

  try {
    const data = await app.request("/api/dashboard");
    hero.innerHTML = `
      <div class="hero-grid">
        <div>
          <span class="eyebrow">${app.escapeHtml(data.role)} dashboard</span>
          <h1>Welcome back, ${app.escapeHtml(session.user.name)}.</h1>
          <p>Everything relevant to your role is pulled into one place so you can keep sponsorship work moving.</p>
        </div>
        <div class="hero-aside">
          <strong>Active session</strong>
          <p class="small muted">${app.escapeHtml(session.user.email)}</p>
          <div class="small muted">Role-aware navigation and API access are both live.</div>
        </div>
      </div>
    `;

    if (data.role === "club") {
      summaryTarget.innerHTML = [
        metricCard("Events", data.summary.totalEvents || 0),
        metricCard("Approved", data.summary.approvedEvents || 0),
        metricCard("Pending Review", data.summary.pendingEvents || 0)
      ].join("");

      primaryTitle.textContent = "Your Events";
      primaryList.innerHTML = data.events.length
        ? data.events
            .map(
              (event) => `
                <article class="list-item">
                  <h4>${app.escapeHtml(event.title)}</h4>
                  <div class="list-meta">
                    <span>${app.formatDate(event.eventDate)}</span>
                    <span>${app.escapeHtml(event.location)}</span>
                    ${app.statusBadge(event.approvalStatus)}
                  </div>
                  <div class="inline-actions mt-09">
                    <a class="button-soft" href="/event-details.html?id=${event.id}">Open Event</a>
                  </div>
                </article>
              `
            )
            .join("")
        : app.renderEmpty("No events yet", "Start by creating your first campus event.");

      secondaryTitle.textContent = "Sponsor Requests";
      secondaryList.innerHTML = data.collaborations.length
        ? data.collaborations
            .map(
              (item) => `
                <article class="list-item">
                  <h4>${app.escapeHtml(item.eventTitle)}</h4>
                  <div class="list-meta">
                    <span>${app.escapeHtml(item.companyName)}</span>
                    <span>${app.escapeHtml(item.tierName)}</span>
                    <span>${app.formatCurrency(item.tierPrice)}</span>
                    ${app.statusBadge(item.status)}
                  </div>
                  <div class="inline-actions mt-09">
                    <a class="button-soft" href="/chat.html?collab=${item.id}">Open Chat</a>
                  </div>
                </article>
              `
            )
            .join("")
        : app.renderEmpty("No sponsor requests yet", "Approved events will start attracting interest here.");
    }

    if (data.role === "company") {
      summaryTarget.innerHTML = [
        metricCard("Requests", data.summary.totalRequests || 0),
        metricCard("Accepted", data.summary.activeCollaborations || 0),
        metricCard("Media Records", data.summary.mediaReceived || 0)
      ].join("");

      primaryTitle.textContent = "Your Collaborations";
      primaryList.innerHTML = data.collaborations.length
        ? data.collaborations
            .map(
              (item) => `
                <article class="list-item">
                  <h4>${app.escapeHtml(item.eventTitle)}</h4>
                  <div class="list-meta">
                    <span>${app.escapeHtml(item.clubName)}</span>
                    <span>${app.escapeHtml(item.tierName)}</span>
                    ${app.statusBadge(item.status)}
                  </div>
                  <div class="inline-actions mt-09">
                    <a class="button-soft" href="/chat.html?collab=${item.id}">Open Chat</a>
                    <a class="button-soft" href="/event-details.html?id=${item.eventId}">Open Event</a>
                  </div>
                </article>
              `
            )
            .join("")
        : app.renderEmpty("No collaborations yet", "Browse approved events and send your first request.");

      secondaryTitle.textContent = "Recommended Events";
      secondaryList.innerHTML = data.eventRecommendations.length
        ? data.eventRecommendations
            .map(
              (event) => `
                <article class="list-item">
                  <h4>${app.escapeHtml(event.title)}</h4>
                  <div class="list-meta">
                    <span>${app.escapeHtml(event.clubName)}</span>
                    <span>${app.escapeHtml(event.category)}</span>
                    <span>${app.formatDate(event.eventDate)}</span>
                  </div>
                  <div class="inline-actions mt-09">
                    <a class="button-soft" href="/event-details.html?id=${event.id}">Review Opportunity</a>
                  </div>
                </article>
              `
            )
            .join("")
        : app.renderEmpty("No recommendations yet", "Approved events will appear here.");
    }

    if (data.role === "admin") {
      summaryTarget.innerHTML = [
        metricCard("Users", data.summary.totalUsers || 0),
        metricCard("Pending Events", data.summary.pendingEvents || 0),
        metricCard("Messages", data.summary.totalMessages || 0)
      ].join("");

      primaryTitle.textContent = "Pending Events";
      primaryList.innerHTML = data.pendingEvents.length
        ? data.pendingEvents
            .map(
              (event) => `
                <article class="list-item">
                  <h4>${app.escapeHtml(event.title)}</h4>
                  <div class="list-meta">
                    <span>${app.escapeHtml(event.clubName)}</span>
                    <span>${app.escapeHtml(event.location)}</span>
                    <span>${app.formatDate(event.eventDate)}</span>
                  </div>
                  <div class="inline-actions mt-09">
                    <a class="button-soft" href="/event-details.html?id=${event.id}">Open Event</a>
                    <a class="button-soft" href="/admin.html">Moderate</a>
                  </div>
                </article>
              `
            )
            .join("")
        : app.renderEmpty("No pending events", "Everything is currently reviewed.");

      secondaryTitle.textContent = "Recent Users";
      secondaryList.innerHTML = data.recentUsers.length
        ? data.recentUsers
            .map(
              (user) => `
                <article class="list-item">
                  <h4>${app.escapeHtml(user.name)}</h4>
                  <div class="list-meta">
                    <span>${app.escapeHtml(user.email)}</span>
                    <span>${app.escapeHtml(user.role)}</span>
                    <span>${app.formatDate(user.createdAt)}</span>
                  </div>
                </article>
              `
            )
            .join("")
        : app.renderEmpty("No users found", "User records will appear here.");
    }
  } catch (error) {
    app.setNotice(notice, error.message, "error");
  }
});
