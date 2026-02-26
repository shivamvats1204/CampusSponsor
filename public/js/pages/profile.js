document.addEventListener("DOMContentLoaded", async () => {
  const app = window.CampusSponsor;
  const session = app.requireAuth();
  if (!session) {
    return;
  }

  const hero = document.getElementById("profileHero");
  const form = document.getElementById("profileForm");
  const notice = document.getElementById("profileNotice");
  const clubFields = document.getElementById("clubProfileFields");
  const companyFields = document.getElementById("companyProfileFields");

  function renderHero(user) {
    hero.innerHTML = `
      <div class="hero-grid">
        <div>
          <span class="eyebrow">${app.escapeHtml(user.role)} profile</span>
          <h1>${app.escapeHtml(user.name)}</h1>
          <p>Keep your profile current so clubs and companies can evaluate fit more quickly.</p>
        </div>
        <div class="hero-aside">
          <strong>Account email</strong>
          <p class="small muted">${app.escapeHtml(user.email)}</p>
        </div>
      </div>
    `;
  }

  function fillForm(user) {
    renderHero(user);
    form.querySelector("#name").value = user.name || "";
    form.querySelector("#email").value = user.email || "";
    clubFields.classList.toggle("hidden", user.role !== "club");
    companyFields.classList.toggle("hidden", user.role !== "company");

    if (user.role === "club") {
      form.querySelector("#collegeName").value = user.profile.collegeName || "";
      form.querySelector("#clubName").value = user.profile.clubName || "";
      form.querySelector("#audienceSize").value = user.profile.audienceSize || "";
      form.querySelector("#description").value = user.profile.description || "";
      form.querySelector("#pastEvents").value = user.profile.pastEvents || "";
    }

    if (user.role === "company") {
      form.querySelector("#companyName").value = user.profile.companyName || "";
      form.querySelector("#industry").value = user.profile.industry || "";
      form.querySelector("#marketingGoals").value = user.profile.marketingGoals || "";
      form.querySelector("#budgetRange").value = user.profile.budgetRange || "";
    }
  }

  try {
    const data = await app.request("/api/auth/me");
    fillForm(data.user);
    app.updateSessionUser(data.user);
  } catch (error) {
    app.setNotice(notice, error.message, "error");
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    app.clearNotice(notice);

    try {
      const payload = Object.fromEntries(new FormData(form).entries());
      const data = await app.request("/api/profile/update", {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      fillForm(data.user);
      app.updateSessionUser(data.user);
      app.setNotice(notice, data.message, "success");
    } catch (error) {
      app.setNotice(notice, error.message, "error");
    }
  });
});
