const SIMILARITY_THRESHOLD = 0.3;

function computeSimilarity(keysA = [], keysB = []) {
  if (!keysA.length || !keysB.length) return 0;
  const setA = new Set(keysA);
  const setB = new Set(keysB);
  let intersection = 0;
  setA.forEach((item) => {
    if (setB.has(item)) intersection += 1;
  });
  const minSize = Math.min(setA.size, setB.size) || 1;
  return intersection / minSize;
}

function rebuildConnections() {
  chrome.storage.local.get({ highlights: [] }, (data) => {
    const highlights = data.highlights;
    const connections = [];

    for (let i = 0; i < highlights.length; i += 1) {
      for (let j = i + 1; j < highlights.length; j += 1) {
        const a = highlights[i];
        const b = highlights[j];
        const score = computeSimilarity(a.keywords, b.keywords);
        if (score >= SIMILARITY_THRESHOLD) {
          connections.push({
            source: a.id,
            target: b.id,
            score
          });
        }
      }
    }

    chrome.storage.local.set({ connections });
  });
}

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === "rebuildConnections") {
    rebuildConnections();
  }
});
