document.addEventListener("DOMContentLoaded", async () => {
  const app = window.CampusSponsor;
  const session = app.requireAuth(["admin"]);
  if (!session) {
    return;
  }

  const hero = document.getElementById("adminHero");
  const summary = document.getElementById("adminSummary");
  const pendingEventsTable = document.getElementById("pendingEventsTable");
  const usersTable = document.getElementById("usersTable");
  const notice = document.getElementById("adminNotice");

  function metricCard(label, value) {
    return `<article class="card"><div class="small muted">${app.escapeHtml(label)}</div><div class="metric-value">${app.escapeHtml(value)}</div></article>`;
  }

  function renderHero() {
    hero.innerHTML = `
      <div class="hero-grid">
        <div>
          <span class="eyebrow">Admin control</span>
          <h1>Moderation and analytics in one console.</h1>
          <p>Approve event submissions, review user records, and keep the platform quality bar visible.</p>
        </div>
        <div class="hero-aside">
          <strong>Signed in as</strong>
          <p class="small muted">${app.escapeHtml(session.user.email)}</p>
        </div>
      </div>
    `;
  }

  async function loadAdminData() {
    app.clearNotice(notice);

    try {
      const [dashboard, usersResponse, eventsResponse] = await Promise.all([
        app.request("/api/dashboard"),
        app.request("/api/admin/users"),
        app.request("/api/admin/events/pending")
      ]);

      renderHero();
      summary.innerHTML = [
        metricCard("Users", dashboard.summary.totalUsers || 0),
        metricCard("Pending Events", dashboard.summary.pendingEvents || 0),
        metricCard("Collaborations", dashboard.summary.totalCollaborations || 0)
      ].join("");

      pendingEventsTable.innerHTML = eventsResponse.events.length
        ? eventsResponse.events
            .map(
              (event) => `
                <tr>
                  <td><a href="/event-details.html?id=${event.id}">${app.escapeHtml(event.title)}</a></td>
                  <td>${app.escapeHtml(event.clubName)}</td>
                  <td>${app.formatDate(event.eventDate)}</td>
                  <td class="inline-actions">
                    <button class="button-soft" data-approve="${event.id}" data-status="approved" type="button">Approve</button>
                    <button class="button-danger" data-approve="${event.id}" data-status="rejected" type="button">Reject</button>
                  </td>
                </tr>
              `
            )
            .join("")
        : `<tr><td colspan="4">No pending events.</td></tr>`;

      usersTable.innerHTML = usersResponse.users.length
        ? usersResponse.users
            .map(
              (user) => `
                <tr>
                  <td>${app.escapeHtml(user.name)}</td>
                  <td>${app.escapeHtml(user.role)}</td>
                  <td>${app.escapeHtml(user.email)}</td>
                  <td>
                    ${user.id === session.user.id ? "" : `<button class="button-danger" data-delete-user="${user.id}" type="button">Delete</button>`}
                  </td>
                </tr>
              `
            )
            .join("")
        : `<tr><td colspan="4">No users found.</td></tr>`;

      pendingEventsTable.querySelectorAll("[data-approve]").forEach((button) => {
        button.addEventListener("click", async () => {
          await app.request(`/api/admin/events/${button.dataset.approve}/approval`, {
            method: "PUT",
            body: JSON.stringify({
              approvalStatus: button.dataset.status
            })
          });
          await loadAdminData();
        });
      });

      usersTable.querySelectorAll("[data-delete-user]").forEach((button) => {
        button.addEventListener("click", async () => {
          if (!window.confirm("Delete this user and their dependent records?")) {
            return;
          }

          await app.request(`/api/admin/users/${button.dataset.deleteUser}`, {
            method: "DELETE"
          });
          await loadAdminData();
        });
      });
    } catch (error) {
      app.setNotice(notice, error.message, "error");
    }
  }

  loadAdminData();
});
