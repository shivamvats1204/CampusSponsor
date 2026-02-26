document.addEventListener("DOMContentLoaded", () => {
  const { request, setSession, setNotice, clearNotice } = window.CampusSponsor;
  const form = document.getElementById("loginForm");
  const notice = document.getElementById("loginNotice");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearNotice(notice);

    try {
      const payload = Object.fromEntries(new FormData(form).entries());
      const data = await request("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      setSession(data);
      setNotice(notice, "Login successful. Redirecting to your dashboard.", "success");
      window.setTimeout(() => {
        window.location.href = "/dashboard.html";
      }, 500);
    } catch (error) {
      setNotice(notice, error.message, "error");
    }
  });
});

