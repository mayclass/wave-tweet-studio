const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 5173;
const ROOT = __dirname;

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".svg": "image/svg+xml",
  };
  return map[ext] || "application/octet-stream";
}

function parseTweetId(url) {
  const match = String(url || "").match(/(?:x|twitter)\.com\/[A-Za-z0-9_]+\/status\/(\d+)/i);
  return match ? match[1] : "";
}

function normalizeAvatarUrl(url) {
  if (!url) return "";
  return String(url).replace("_normal", "_400x400");
}

async function handleTweetApi(req, res, urlObj) {
  const tweetUrl = urlObj.searchParams.get("url") || "";
  const tweetId = parseTweetId(tweetUrl);

  if (!tweetId) {
    res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ error: "Invalid tweet URL" }));
    return;
  }

  try {
    const fxUrl = `https://api.vxtwitter.com/Twitter/status/${tweetId}`;
    const response = await fetch(fxUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });

    if (!response.ok) {
      throw new Error(`vxtwitter status ${response.status}`);
    }

    const data = await response.json();

    const rawAvatar =
      data.user_profile_image_url_https ||
      data.user_profile_image_url ||
      data.user_profile_image ||
      data.user?.profile_image_url_https ||
      data.user?.profile_image_url ||
      "";
    const avatarUrl = normalizeAvatarUrl(rawAvatar);

    const mediaCandidates = [];
    if (Array.isArray(data.media_extended)) {
      for (const media of data.media_extended) {
        if (media?.type === "image" && media?.url) mediaCandidates.push(media.url);
        if (media?.type === "video" && media?.url) mediaCandidates.push(media.url);
      }
    }
    if (Array.isArray(data.mediaURLs)) {
      mediaCandidates.push(...data.mediaURLs.filter(Boolean));
    }

    const payload = {
      author: data.user_screen_name ? `@${data.user_screen_name}` : "@unknown",
      avatarUrl,
      date: data.date || "",
      text: data.text || "",
      mediaUrl: mediaCandidates[0] || "",
      allMedia: mediaCandidates,
    };

    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(payload));
  } catch (error) {
    res.writeHead(502, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ error: "Tweet fetch failed", detail: String(error.message || error) }));
  }
}

function serveStatic(req, res, pathname) {
  const safePath = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.join(ROOT, safePath);

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }

    res.writeHead(200, { "Content-Type": contentType(filePath) });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  const host = req.headers.host || `localhost:${PORT}`;
  const urlObj = new URL(req.url, `http://${host}`);

  if (urlObj.pathname === "/api/tweet") {
    await handleTweetApi(req, res, urlObj);
    return;
  }

  serveStatic(req, res, urlObj.pathname);
});

server.listen(PORT, () => {
  console.log(`WaveTweet Studio running at http://localhost:${PORT}`);
});
