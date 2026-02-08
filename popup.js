const highlightCount = document.getElementById("highlight-count");
const connectionCount = document.getElementById("connection-count");
const highlightList = document.getElementById("highlight-list");
const openMapButton = document.getElementById("open-map");

function renderHighlights(highlights) {
  highlightList.innerHTML = "";
  const recent = highlights.slice(-5).reverse();

  if (recent.length === 0) {
    const empty = document.createElement("li");
    empty.textContent = "No highlights yet. Select text on any page.";
    highlightList.appendChild(empty);
    return;
  }

  recent.forEach((item) => {
    const li = document.createElement("li");
    const title = document.createElement("span");
    title.textContent = item.text.length > 80 ? `${item.text.slice(0, 80)}...` : item.text;

    const meta = document.createElement("small");
    meta.textContent = new URL(item.url).hostname;

    li.appendChild(title);
    li.appendChild(meta);
    highlightList.appendChild(li);
  });
}

function loadData() {
  chrome.storage.local.get({ highlights: [], connections: [] }, (data) => {
    highlightCount.textContent = data.highlights.length.toString();
    connectionCount.textContent = data.connections.length.toString();
    renderHighlights(data.highlights);
  });
}

openMapButton.addEventListener("click", () => {
  chrome.tabs.create({ url: chrome.runtime.getURL("map.html") });
});

loadData();
