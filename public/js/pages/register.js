document.addEventListener("DOMContentLoaded", () => {
  const { request, setSession, setNotice, clearNotice } = window.CampusSponsor;
  const form = document.getElementById("registerForm");
  const roleField = document.getElementById("role");
  const clubFields = document.getElementById("clubFields");
  const companyFields = document.getElementById("companyFields");
  const notice = document.getElementById("registerNotice");

  function syncRoleFields() {
    const isClub = roleField.value === "club";
    clubFields.classList.toggle("hidden", !isClub);
    companyFields.classList.toggle("hidden", isClub);
  }

  roleField.addEventListener("change", syncRoleFields);
  syncRoleFields();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearNotice(notice);

    try {
      const payload = Object.fromEntries(new FormData(form).entries());
      const data = await request("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      setSession(data);
      setNotice(notice, "Registration complete. Redirecting to your dashboard.", "success");
      window.setTimeout(() => {
        window.location.href = "/dashboard.html";
      }, 500);
    } catch (error) {
      setNotice(notice, error.message, "error");
    }
  });
});
