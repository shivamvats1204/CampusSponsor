(function bootstrapCampusSponsor() {
  const STORAGE_KEY = "campussponsor_session";
  const THEME_KEY = "campussponsor_theme";

  function getStoredTheme() {
    try {
      return localStorage.getItem(THEME_KEY) || "light";
    } catch (error) {
      return "light";
    }
  }

  function applyTheme(theme) {
    const safeTheme = theme === "dark" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", safeTheme);
    document.documentElement.style.colorScheme = safeTheme;
    return safeTheme;
  }

  function setTheme(theme) {
    const safeTheme = applyTheme(theme);
    try {
      localStorage.setItem(THEME_KEY, safeTheme);
    } catch (error) {
      console.warn("Unable to persist theme preference.", error);
    }

    const toggle = document.querySelector("[data-theme-toggle]");
    if (toggle) {
      toggle.textContent = safeTheme === "dark" ? "Light Mode" : "Dark Mode";
      toggle.setAttribute("aria-pressed", String(safeTheme === "dark"));
    }

    return safeTheme;
  }

  function toggleTheme() {
    return setTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark");
  }

  applyTheme(getStoredTheme());

  function apiBase() {
    if (window.CAMPUS_SPONSOR_API_BASE) {
      return window.CAMPUS_SPONSOR_API_BASE;
    }

    if (window.location.origin && window.location.origin.startsWith("http")) {
      return "";
    }

    return "http://localhost:4000";
  }

  function getSession() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    } catch (error) {
      return null;
    }
  }

  function setSession(session) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }

  function clearSession() {
    localStorage.removeItem(STORAGE_KEY);
  }

  function updateSessionUser(user) {
    const session = getSession();
    if (!session) {
      return;
    }

    setSession({ ...session, user });
  }

  async function request(path, options = {}) {
    const headers = new Headers(options.headers || {});
    const session = getSession();
    const isFormData = options.body instanceof FormData;

    if (!isFormData && options.body !== undefined && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    if (session?.token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${session.token}`);
    }

    const response = await fetch(`${apiBase()}${path}`, {
      ...options,
      headers
    });

    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json") ? await response.json() : await response.text();

    if (!response.ok) {
      throw new Error(typeof data === "string" ? data : data.message || "Request failed.");
    }

    return data;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function formatDate(value) {
    if (!value) {
      return "TBD";
    }

    return new Date(value).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  }

  function formatDateTime(value) {
    if (!value) {
      return "Unknown";
    }

    return new Date(value).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short"
    });
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(Number(value || 0));
  }

  function statusBadge(status) {
    const value = String(status || "pending").toLowerCase();
    return `<span class="status-badge ${escapeHtml(value)}">${escapeHtml(value)}</span>`;
  }

  function setNotice(element, message, type = "info") {
    if (!element) {
      return;
    }

    element.className = `notice show ${type}`;
    element.textContent = message;
  }

  function clearNotice(element) {
    if (!element) {
      return;
    }

    element.className = "notice";
    element.textContent = "";
  }

  function requireAuth(roles = []) {
    const session = getSession();

    if (!session?.token || !session?.user) {
      window.location.href = "/login.html";
      return null;
    }

    if (roles.length && !roles.includes(session.user.role)) {
      window.location.href = "/dashboard.html";
      return null;
    }

    return session;
  }

  function renderEmpty(title, copy) {
    return `<div class="empty-state"><strong>${escapeHtml(title)}</strong><p>${escapeHtml(copy)}</p></div>`;
  }

  function renderNav() {
    const target = document.querySelector("[data-nav]");
    if (!target) {
      return;
    }

    const session = getSession();
    const currentPath = window.location.pathname || "/";
    const links = [
      { href: "/index.html", label: "Home" },
      { href: "/browse-events.html", label: "Explore Events" }
    ];

    if (session?.user?.role === "club") {
      links.push({ href: "/create-event.html", label: "Create Event" });
    }

    if (session?.user) {
      links.push({ href: "/dashboard.html", label: "Dashboard" });
      links.push({ href: "/chat.html", label: "Messages" });
      links.push({ href: "/profile.html", label: "Profile" });
    }

    if (session?.user?.role === "admin") {
      links.push({ href: "/admin.html", label: "Admin" });
    }

    const navLinks = links
      .map((link) => {
        const active = currentPath === link.href || currentPath.endsWith(link.href);
        return `<a class="nav-link ${active ? "active" : ""}" href="${link.href}">${link.label}</a>`;
      })
      .join("");

    const themeButton = `
      <button
        class="theme-toggle"
        type="button"
        data-theme-toggle
        aria-label="Toggle color theme"
        aria-pressed="${String(document.documentElement.getAttribute("data-theme") === "dark")}"
      >
        ${document.documentElement.getAttribute("data-theme") === "dark" ? "Light Mode" : "Dark Mode"}
      </button>
    `;

    const actionHtml = session?.user
      ? `
        ${themeButton}
        <div class="session-chip">
          <span class="tag">${escapeHtml(session.user.role)}</span>
          <button class="button-soft nav-logout" type="button" data-logout>Logout</button>
        </div>
      `
      : `
        ${themeButton}
        <a class="button-soft" href="/login.html">Login</a>
        <a class="button" href="/register.html">Get Started</a>
      `;

    target.innerHTML = `
      <div class="nav-shell">
        <a class="brand" href="/index.html">
          <span class="brand-mark">CS</span>
          <span>CampusSponsor</span>
        </a>
        <nav class="nav-links">${navLinks}</nav>
        <div class="nav-actions">${actionHtml}</div>
      </div>
    `;

    const logoutButton = target.querySelector("[data-logout]");
    const themeToggle = target.querySelector("[data-theme-toggle]");

    if (themeToggle) {
      themeToggle.addEventListener("click", () => {
        toggleTheme();
      });
    }

    if (logoutButton) {
      logoutButton.addEventListener("click", async () => {
        try {
          await request("/api/auth/logout");
        } catch (error) {
          console.error(error);
        }

        clearSession();
        window.location.href = "/index.html";
      });
    }
  }

  window.CampusSponsor = {
    apiBase,
    request,
    getSession,
    setSession,
    clearSession,
    updateSessionUser,
    escapeHtml,
    formatDate,
    formatDateTime,
    formatCurrency,
    statusBadge,
    setNotice,
    clearNotice,
    requireAuth,
    renderEmpty,
    renderNav,
    getTheme: getStoredTheme,
    setTheme,
    toggleTheme
  };

  document.addEventListener("DOMContentLoaded", renderNav);
})();
