const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");
const messages = document.getElementById("messages");
const welcome = document.getElementById("welcome");
const sendBtn = document.getElementById("sendBtn");
const newChatBtn = document.getElementById("newChatBtn");
const toast = document.getElementById("toast");
const sidebar = document.getElementById("sidebar");
const mobileMenu = document.getElementById("mobileMenu");

let isSending = false;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2800);
}

function resizeInput() {
  messageInput.style.height = "auto";
  messageInput.style.height = Math.min(messageInput.scrollHeight, 150) + "px";
}
messageInput.addEventListener("input", resizeInput);

function scrollToBottom() {
  const area = document.getElementById("chatArea");
  area.scrollTop = area.scrollHeight;
  window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
}

function addMessage(role, content) {
  welcome.hidden = true;
  const row = document.createElement("div");
  row.className = `message ${role}`;

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = role === "user" ? "You" : "✦";

  const contentWrap = document.createElement("div");
  contentWrap.className = "message-content";

  const label = document.createElement("div");
  label.className = "message-label";
  label.textContent = role === "user" ? "YOU" : "NOVA TUTOR";

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  // Use textContent rather than innerHTML so model responses cannot inject HTML.
  bubble.textContent = content;

  contentWrap.append(label, bubble);
  row.append(avatar, contentWrap);
  messages.appendChild(row);
  scrollToBottom();
  return row;
}

function addTyping() {
  welcome.hidden = true;
  const row = document.createElement("div");
  row.className = "message assistant";
  row.id = "typingIndicator";
  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = "✦";
  const wrap = document.createElement("div");
  wrap.className = "message-content";
  const label = document.createElement("div");
  label.className = "message-label";
  label.textContent = "NOVA TUTOR IS THINKING";
  const dots = document.createElement("div");
  dots.className = "typing";
  dots.innerHTML = "<span></span><span></span><span></span>";
  wrap.append(label, dots);
  row.append(avatar, wrap);
  messages.appendChild(row);
  scrollToBottom();
  return row;
}

async function sendMessage(text) {
  const message = (text ?? messageInput.value).trim();
  if (!message || isSending) return;

  isSending = true;
  sendBtn.disabled = true;
  messageInput.value = "";
  resizeInput();
  addMessage("user", message);
  const typing = addTyping();

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });
    const data = await response.json();
    typing.remove();

    if (!response.ok) {
      showToast(data.error || "Something went wrong.");
      addMessage("assistant", data.error || "Sorry, I couldn't answer that. Please try again.");
      return;
    }
    addMessage("assistant", data.answer || "I couldn't generate an answer.");
  } catch (error) {
    typing.remove();
    addMessage("assistant", "I couldn't connect to the server. Make sure the Flask app is running, then try again.");
  } finally {
    isSending = false;
    sendBtn.disabled = false;
    messageInput.focus();
  }
}

chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  sendMessage();
});

document.querySelectorAll("[data-prompt]").forEach((button) => {
  button.addEventListener("click", () => {
    const prompt = button.getAttribute("data-prompt");
    sidebar.classList.remove("open");
    sendMessage(prompt);
  });
});

newChatBtn.addEventListener("click", async () => {
  try {
    await fetch("/api/clear", { method: "POST" });
    messages.replaceChildren();
    welcome.hidden = false;
    sidebar.classList.remove("open");
    showToast("Started a new conversation");
  } catch (error) {
    showToast("Couldn't clear the conversation. Please refresh and try again.");
  }
});

mobileMenu.addEventListener("click", () => sidebar.classList.toggle("open"));

document.addEventListener("click", (event) => {
  if (window.innerWidth <= 650 && sidebar.classList.contains("open") &&
      !sidebar.contains(event.target) && !mobileMenu.contains(event.target)) {
    sidebar.classList.remove("open");
  }
});

messageInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    chatForm.requestSubmit();
  }
});
