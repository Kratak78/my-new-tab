import "./style.css";

const defaults = {
  playerID: null,
  links: [{ name: "Youtube", url: "https://www.youtube.com/" }],
};

const maxAge = 10 * 60 * 1000;
const maxRecent = 8;

const proxy = "newtab-proxy.martin-kratochvil2008.workers.dev";
const inExtension = typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.id;

function apiUrl(url) {
  return inExtension ? url : proxy + encodeURIComponent(url);
}

function loadSettings() {
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem("settings")) };
  } catch {
    return defaults;
  }
}

function saveSettings(s) {
  localStorage.setItem("settings", JSON.stringify(s));
}

const settings = loadSettings();
const playerID = settings.playerID;
const links = settings.links;

const clock = document.querySelector("#clock");
const date = document.querySelector("#date");
const form = document.querySelector("#search");
const input = document.querySelector("#q");
const recentList = document.querySelector("#recent-list");
const nav = document.querySelector("#link");
const panel = document.querySelector("#settings-panel");
const idInput = document.querySelector("#id-input");
const linkRows = document.querySelector("#link-rows");

function renderShortcuts() {
  for (const link of links) {
    try {
      const a = document.createElement("a");
      a.href = link.url;
      a.title = link.name;

      const img = document.createElement("img");
      const domain = new URL(link.url).hostname;
      img.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
      img.alt = link.name;

      a.appendChild(img);
      nav.appendChild(a);
    } catch (err) {
      console.error(`Invalid link: ${link.name} (${link.url})`, err);
    }
  }
}

function setupLogos() {
  document.querySelector("#bl-logo").src =
    "https://www.google.com/s2/favicons?domain=beatleader.xyz&sz=64";
  document.querySelector("#ss-logo").src =
    "https://www.google.com/s2/favicons?domain=scoresaber.com&sz=64";

  if (playerID) {
    document.querySelector("#bl-link").href = `https://beatleader.com/u/${playerID}`;
    document.querySelector("#ss-link").href = `https://scoresaber.com/u/${playerID}`;
  }
}

function addRow(link = { name: "", url: "" }) {
  const row = document.createElement("div");
  row.className = "link-row";

  const name = document.createElement("input");
  name.placeholder = "Name";
  name.value = link.name;

  const url = document.createElement("input");
  url.placeholder = "https://...";
  url.value = link.url;

  const remove = document.createElement("button");
  remove.type = "button";
  remove.textContent = "Remove";
  remove.addEventListener("click", () => row.remove());

  row.append(name, url, remove);
  linkRows.appendChild(row);
}

function setupSettingsPanel() {
  document.querySelector("#settings-btn").addEventListener("click", () => {
    panel.hidden = !panel.hidden;
    if (!panel.hidden) {
      idInput.value = settings.playerID ?? "";
      linkRows.replaceChildren();
      settings.links.forEach(addRow);
    }
  });

  document.querySelector("#add-link").addEventListener("click", () => addRow());

  document.querySelector("#save").addEventListener("click", () => {
    const id = idInput.value.trim();
    if (id && !/^\d+$/.test(id)) {
      alert("Player IDs are numbers only.");
      return;
    }

    const newLinks = [...linkRows.querySelectorAll(".link-row")]
      .map((row) => {
        const [name, url] = row.querySelectorAll("input");
        let href = url.value.trim();
        if (href && !/^https?:\/\//i.test(href)) href = "https://" + href;
        return { name: name.value.trim(), url: href };
      })
      .filter((l) => l.url);

    saveSettings({ playerID: id || null, links: newLinks });
    location.reload();
  });
}

function loadRecent() {
  try {
    return JSON.parse(localStorage.getItem("recent")) ?? [];
  } catch {
    return [];
  }
}

function addRecent(q) {
  const list = [q, ...loadRecent().filter((item) => item !== q)].slice(0, maxRecent);
  localStorage.setItem("recent", JSON.stringify(list));
}

function renderRecent() {
  const typed = input.value.trim().toLowerCase();
  const matches = loadRecent().filter((q) => q.toLowerCase().includes(typed));

  const items = matches.map((q) => {
    const li = document.createElement("li");
    li.textContent = q;
    li.addEventListener("mousedown", (e) => {
      e.preventDefault();
      input.value = q;
      form.requestSubmit();
    });
    return li;
  });

  recentList.replaceChildren(...items);
  recentList.hidden = items.length === 0;
}

function setupRecent() {
  input.addEventListener("focus", renderRecent);
  input.addEventListener("input", renderRecent);
  input.addEventListener("blur", () => (recentList.hidden = true));
  input.addEventListener("keydown", (e) => {
    if (e.key === "Escape") recentList.hidden = true;
  });
}

function setupSearch() {
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const q = input.value.trim();
    if (!q) return;
    addRecent(q);

    if (typeof chrome !== "undefined" && chrome.search && chrome.search.query) {
      chrome.search.query({ text: q, disposition: "CURRENT_TAB" });
    } else if (typeof browser !== "undefined" && browser.search && browser.search.search) {
      browser.search.search({ query: q });
    } else {
      window.location.href = `https://www.google.com/search?q=${encodeURIComponent(q)}`;
    }
  });
}

function loadWithCache(key, url, render, force = false) {
  let cached = null;
  try {
    cached = JSON.parse(localStorage.getItem(key));
  } catch {}

  if (cached) render(cached.data);
  if (!force && cached && Date.now() - cached.time < maxAge) return;

  fetch(apiUrl(url))
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then((data) => {
      render(data);
      localStorage.setItem(key, JSON.stringify({ data, time: Date.now() }));
    })
    .catch((err) => console.error(err));
}

function renderBeatLeader(data) {
  const acc = (data.scoreStats.averageRankedAccuracy * 100).toFixed(2);
  document.querySelector("#BL").textContent =
    `${data.name} | ${data.pp.toFixed(0)}pp | #${data.rank} (#${data.countryRank} ${data.country}) | ${acc}% avg acc`;
}

function renderScoreSaber(data) {
  const acc = data.stats.averageAccuracy.toFixed(2);
  document.querySelector("#SS").textContent =
    `${data.name} | ${data.stats.totalPP.toFixed(0)}pp | #${data.stats.rank} (#${data.stats.countryRank} ${data.country}) | ${acc}% avg acc`;
}

function loadStats(force = false) {
  if (!playerID) {
    document.querySelector("#BL").textContent = "No player ID set";
    document.querySelector("#SS").textContent = "No player ID set";
    return;
  }

  loadWithCache(
    `bl-${playerID}`,
    `https://api.beatleader.xyz/player/${playerID}`,
    renderBeatLeader,
    force
  );

  loadWithCache(
    `ss-${playerID}`,
    `https://scoresaber.com/api/v2/players/${playerID}/basic`,
    renderScoreSaber,
    force
  );
}

function updateClock() {
  clock.textContent = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function setupClock() {
  date.textContent = new Date().toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  updateClock();
  setInterval(updateClock, 1000);
}

setupLogos();
renderShortcuts();
setupSettingsPanel();
setupSearch();
setupRecent();
setupClock();
loadStats();
document.querySelector("#refreshStats").addEventListener("click", () => loadStats(true));