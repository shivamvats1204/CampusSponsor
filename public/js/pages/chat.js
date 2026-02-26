document.addEventListener("DOMContentLoaded", async () => {
  const app = window.CampusSponsor;
  const session = app.requireAuth();
  if (!session) {
    return;
  }

  const selectedFromQuery = new URLSearchParams(window.location.search).get("collab");
  const chatList = document.getElementById("chatList");
  const chatTitle = document.getElementById("chatTitle");
  const messagesTarget = document.getElementById("messages");
  const form = document.getElementById("messageForm");
  const notice = document.getElementById("chatNotice");
  let collaborations = [];
  let selectedCollaboration = null;

  function renderChatList() {
    if (!collaborations.length) {
      chatList.innerHTML = app.renderEmpty("No collaborations yet", "Once a request is sent or received, it will appear here.");
      return;
    }

    chatList.innerHTML = collaborations
      .map(
        (item) => `
          <article class="chat-item ${selectedCollaboration?.id === item.id ? "active" : ""}" data-collab-id="${item.id}">
            <strong>${app.escapeHtml(item.eventTitle)}</strong>
            <div class="small">${app.escapeHtml(item.companyName || item.clubName)}</div>
            <div class="list-meta">
              <span>${app.escapeHtml(item.tierName)}</span>
              ${app.statusBadge(item.status)}
            </div>
          </article>
        `
      )
      .join("");

    chatList.querySelectorAll("[data-collab-id]").forEach((item) => {
      item.addEventListener("click", () => {
        const selected = collaborations.find((row) => String(row.id) === item.dataset.collabId);
        selectConversation(selected);
      });
    });
  }

  function renderMessages(messages) {
    if (!messages.length) {
      messagesTarget.innerHTML = app.renderEmpty("No messages yet", "Start the conversation from the composer below.");
      return;
    }

    messagesTarget.innerHTML = messages
      .map(
        (message) => `
          <article class="message-bubble ${message.senderId === session.user.id ? "mine" : ""}">
            <div>${app.escapeHtml(message.message || "")}</div>
            ${message.attachment?.url ? `<div class="inline-actions mt-07"><a class="button-soft" href="${app.escapeHtml(message.attachment.url)}" target="_blank" rel="noreferrer">${app.escapeHtml(message.attachment.name || "Open attachment")}</a></div>` : ""}
            <div class="message-meta">${app.formatDateTime(message.createdAt)}</div>
          </article>
        `
      )
      .join("");

    messagesTarget.scrollTop = messagesTarget.scrollHeight;
  }

  async function loadMessages() {
    if (!selectedCollaboration) {
      messagesTarget.innerHTML = app.renderEmpty("Select a conversation", "Choose a collaboration from the left to open the thread.");
      return;
    }

    const titleBits = [selectedCollaboration.eventTitle];
    if (session.user.role === "club") {
      titleBits.push(selectedCollaboration.companyName);
    }
    if (session.user.role === "company") {
      titleBits.push(selectedCollaboration.clubName);
    }
    chatTitle.textContent = titleBits.filter(Boolean).join(" - ");

    try {
      const { messages } = await app.request(`/api/messages/${selectedCollaboration.chatId}`);
      renderMessages(messages);
    } catch (error) {
      app.setNotice(notice, error.message, "error");
    }
  }

  function selectConversation(collaboration) {
    selectedCollaboration = collaboration;
    renderChatList();
    loadMessages();
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    app.clearNotice(notice);

    if (!selectedCollaboration) {
      app.setNotice(notice, "Select a collaboration before sending a message.", "error");
      return;
    }

    try {
      const formData = new FormData(form);
      formData.append("collaborationId", selectedCollaboration.id);
      await app.request("/api/messages/send", {
        method: "POST",
        body: formData
      });
      form.reset();
      await loadMessages();
    } catch (error) {
      app.setNotice(notice, error.message, "error");
    }
  });

  try {
    const data = await app.request("/api/collab/all");
    collaborations = data.collaborations;
    selectedCollaboration =
      collaborations.find((item) => String(item.id) === String(selectedFromQuery)) || collaborations[0] || null;
    renderChatList();
    await loadMessages();
    window.setInterval(loadMessages, 12000);
  } catch (error) {
    app.setNotice(notice, error.message, "error");
  }
});
