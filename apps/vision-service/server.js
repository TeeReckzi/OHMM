import { createServer } from "node:http";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PORT = Number(process.env.OHMM_VISION_PORT || 8080);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const captureDir = path.join(__dirname, "captures", "raw");
const latestCapturePath = path.join(captureDir, "latest.png");

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => resolve(Buffer.concat(chunks)));
    request.on("error", reject);
  });
}

async function extractImageBuffer(request, body) {
  const contentType = request.headers["content-type"] || "";

  if (contentType.includes("application/json")) {
    const payload = JSON.parse(body.toString("utf8"));
    const base64 = payload.imageBase64 || payload.dataUrl?.split(",")[1];

    if (!base64) {
      throw new Error("JSON payload did not include imageBase64 or dataUrl.");
    }

    return Buffer.from(base64, "base64");
  }

  return body;
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, X-OHMM-Screenshot-Url",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  });
  response.end(JSON.stringify(payload));
}

const server = createServer(async (request, response) => {
  if (request.method === "OPTIONS") {
    sendJson(response, 204, {});
    return;
  }

  if (request.method !== "POST" || request.url !== "/process-gear-frame") {
    sendJson(response, 404, { ok: false, error: "Not found" });
    return;
  }

  try {
    console.log("Gear capture request received");

    const body = await readRequestBody(request);
    const imageBuffer = await extractImageBuffer(request, body);

    if (imageBuffer.length === 0) {
      throw new Error("Screenshot payload was empty.");
    }

    await mkdir(captureDir, { recursive: true });
    await writeFile(latestCapturePath, imageBuffer);

    console.log(`received screenshot: ${latestCapturePath}`);
    sendJson(response, 200, {
      ok: true,
      message: "received screenshot",
      savedTo: latestCapturePath
    });
  } catch (error) {
    console.error("Failed to receive screenshot:", error);
    sendJson(response, 500, {
      ok: false,
      error: error.message || "Failed to receive screenshot"
    });
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`OHMM vision service listening on http://127.0.0.1:${PORT}`);
});
