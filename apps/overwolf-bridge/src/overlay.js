const STATUS_KEY = "ohmm.captureStatus";
const toast = document.getElementById("toast");
const message = document.getElementById("message");

function readStatus() {
  try {
    return JSON.parse(localStorage.getItem(STATUS_KEY) || "{}");
  } catch {
    return {};
  }
}

function renderStatus() {
  const status = readStatus();
  toast.className = `toast ${status.tone || "info"}`;
  message.textContent = status.message || "Bridge ready.";
}

window.addEventListener("storage", (event) => {
  if (event.key === STATUS_KEY) {
    renderStatus();
  }
});

renderStatus();
setInterval(renderStatus, 500);
