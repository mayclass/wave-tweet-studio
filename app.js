const els = {
  tweetUrl: document.getElementById("tweetUrl"),
  loadTweetBtn: document.getElementById("loadTweetBtn"),
  clearBtn: document.getElementById("clearBtn"),
  status: document.getElementById("status"),
  bgStyle: document.getElementById("bgStyle"),
  exportAspect: document.getElementById("exportAspect"),
  cardRadius: document.getElementById("cardRadius"),
  downloadMediaBtn: document.getElementById("downloadMediaBtn"),
  exportCardBtn: document.getElementById("exportCardBtn"),
  designCard: document.getElementById("designCard"),
  tweetAvatar: document.getElementById("tweetAvatar"),
  tweetAvatarFallback: document.getElementById("tweetAvatarFallback"),
  tweetAuthor: document.getElementById("tweetAuthor"),
  tweetText: document.getElementById("tweetText"),
  tweetMedia: document.getElementById("tweetMedia"),
};

let currentMediaUrl = "";

function setStatus(message, type = "info") {
  const color = {
    info: "#dce6ef",
    success: "#b5f8d5",
    error: "#ffd2c9",
  }[type] || "#dce6ef";

  els.status.textContent = message;
  els.status.style.color = color;
}

function parseTweetId(url) {
  const pattern = /(?:x|twitter)\.com\/[A-Za-z0-9_]+\/status\/(\d+)/i;
  const match = url.match(pattern);
  return match ? match[1] : "";
}

function updateDesignFromControls() {
  els.designCard.classList.remove("theme-sunset", "theme-ocean", "theme-forest", "theme-mono");
  els.designCard.classList.add(`theme-${els.bgStyle.value}`);

  els.designCard.classList.remove("preset-square", "preset-portrait", "preset-story");
  els.designCard.classList.add(`preset-${els.exportAspect.value}`);

  const radius = Number.parseInt(els.cardRadius.value, 10);
  els.designCard.style.borderRadius = `${radius}px`;
}

function setTweetPreview(data) {
  els.tweetAuthor.textContent = data.author || "@unknown";
  els.tweetText.textContent = data.text || "No text found for this tweet.";

  const avatarUrl = data.avatarUrl || "";
  const fallbackInitial = (data.author || "@unknown").replace("@", "").slice(0, 1).toUpperCase() || "U";
  els.tweetAvatarFallback.textContent = fallbackInitial;

  if (avatarUrl) {
    els.tweetAvatar.src = avatarUrl;
    els.tweetAvatar.hidden = false;
    els.tweetAvatarFallback.hidden = true;
  } else {
    els.tweetAvatar.removeAttribute("src");
    els.tweetAvatar.hidden = true;
    els.tweetAvatarFallback.hidden = false;
  }

  currentMediaUrl = data.mediaUrl || "";
  els.downloadMediaBtn.disabled = !currentMediaUrl;

  if (currentMediaUrl) {
    els.tweetMedia.src = currentMediaUrl;
    els.tweetMedia.hidden = false;
  } else {
    els.tweetMedia.removeAttribute("src");
    els.tweetMedia.hidden = true;
  }
}

function resetPreview() {
  els.tweetAvatar.removeAttribute("src");
  els.tweetAvatar.hidden = true;
  els.tweetAvatarFallback.hidden = false;
  els.tweetAvatarFallback.textContent = "U";
  els.tweetAuthor.textContent = "@unknown";
  els.tweetText.textContent = "Tweet content will appear here after loading a URL.";
  els.tweetMedia.removeAttribute("src");
  els.tweetMedia.hidden = true;
  currentMediaUrl = "";
  els.downloadMediaBtn.disabled = true;
  setStatus('Paste a URL and click "Load Tweet".');
}

async function loadTweet() {
  const url = (els.tweetUrl.value || "").trim();
  if (!url) {
    setStatus("Please paste a tweet URL first.", "error");
    return;
  }

  const tweetId = parseTweetId(url);
  if (!tweetId) {
    setStatus("This does not look like a valid tweet link.", "error");
    return;
  }

  setStatus("Loading tweet data...");

  try {
    const res = await fetch(`/api/tweet?url=${encodeURIComponent(url)}`);
    if (!res.ok) {
      throw new Error(`Request failed with status ${res.status}`);
    }

    const data = await res.json();
    setTweetPreview(data);
    setStatus("Tweet loaded. You can now edit and export.", "success");
  } catch (err) {
    console.error(err);
    setStatus(
      "Could not load this tweet. Some tweets are private/restricted or blocked by source changes.",
      "error"
    );
  }
}

function downloadFile(url, name) {
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function downloadTweetMedia() {
  if (!currentMediaUrl) {
    setStatus("No media found in this tweet.", "error");
    return;
  }

  const name = `tweet-media-${Date.now()}`;
  downloadFile(currentMediaUrl, name);
}

async function exportDesignedCard() {
  setStatus("Rendering your design...");
  const canvas = await html2canvas(els.designCard, {
    backgroundColor: null,
    scale: 2,
    useCORS: true,
  });
  const image = canvas.toDataURL("image/png");
  const aspect = els.exportAspect.value || "portrait";
  downloadFile(image, `wave-tweet-${aspect}-${Date.now()}.png`);
  setStatus("Design exported as PNG.", "success");
}

els.loadTweetBtn.addEventListener("click", loadTweet);
els.clearBtn.addEventListener("click", () => {
  els.tweetUrl.value = "";
  resetPreview();
});
els.downloadMediaBtn.addEventListener("click", downloadTweetMedia);
els.exportCardBtn.addEventListener("click", exportDesignedCard);
els.bgStyle.addEventListener("change", updateDesignFromControls);
els.exportAspect.addEventListener("change", updateDesignFromControls);
els.cardRadius.addEventListener("input", updateDesignFromControls);

updateDesignFromControls();
