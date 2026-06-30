const HOTKEY_NAME = "import_gear_hotkey";
const SERVICE_URL = "http://127.0.0.1:8080/process-gear-frame";
const STATUS_KEY = "ohmm.captureStatus";

function updateStatus(message, tone = "info") {
  const payload = {
    message,
    tone,
    updatedAt: new Date().toISOString()
  };

  localStorage.setItem(STATUS_KEY, JSON.stringify(payload));

  if (typeof overwolf !== "undefined" && overwolf.windows) {
    overwolf.windows.obtainDeclaredWindow("overlay", (result) => {
      if (result && result.status === "success") {
        overwolf.windows.restore(result.window.id);
      }
    });
  }
}

function takeScreenshot() {
  return new Promise((resolve, reject) => {
    if (!overwolf || !overwolf.media || !overwolf.media.takeScreenshot) {
      reject(new Error("Overwolf media screenshot API is unavailable."));
      return;
    }

    overwolf.media.takeScreenshot((result) => {
      if (result && result.status === "success" && result.url) {
        resolve(result.url);
        return;
      }

      reject(new Error(result && result.error ? result.error : "Screenshot capture failed."));
    });
  });
}

function readScreenshotBlob(screenshotUrl) {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("GET", screenshotUrl, true);
    request.responseType = "blob";
    request.onload = () => {
      if (request.status === 200 || request.status === 0) {
        resolve(request.response);
        return;
      }

      reject(new Error(`Could not read screenshot blob: ${request.status}`));
    };
    request.onerror = () => reject(new Error("Could not read screenshot blob."));
    request.send();
  });
}

async function postScreenshot(screenshotUrl) {
  const blob = await readScreenshotBlob(screenshotUrl);
  const response = await fetch(SERVICE_URL, {
    method: "POST",
    headers: {
      "Content-Type": blob.type || "image/png",
      "X-OHMM-Screenshot-Url": screenshotUrl
    },
    body: blob
  });

  if (!response.ok) {
    throw new Error(`Vision service returned HTTP ${response.status}.`);
  }

  return response.json().catch(() => ({}));
}

async function captureAndSendGearFrame() {
  updateStatus("Capturing gear screenshot...", "info");

  try {
    const screenshotUrl = await takeScreenshot();
    updateStatus("Sending screenshot to OHMM...", "info");
    await postScreenshot(screenshotUrl);
    updateStatus("Screenshot captured. Ready for parsing.", "success");
  } catch (error) {
    console.error("[OHMM Bridge] Capture failed", error);
    updateStatus(error.message || "Screenshot capture failed.", "error");
  }
}

function registerHotkeyListener() {
  if (!overwolf || !overwolf.settings || !overwolf.settings.hotkeys) {
    updateStatus("Overwolf hotkey API is unavailable.", "error");
    return;
  }

  overwolf.settings.hotkeys.onPressed.addListener((event) => {
    if (event && event.name === HOTKEY_NAME) {
      captureAndSendGearFrame();
    }
  });

  updateStatus("OHMM bridge armed. Press Ctrl+Shift+I in game.", "info");
}

registerHotkeyListener();
