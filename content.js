const HIGHLIGHT_CLASS = "wh-highlight";
const HIGHLIGHT_BUTTON_ID = "wh-highlight-btn";

const STOPWORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "that",
  "this",
  "from",
  "they",
  "their",
  "there",
  "about",
  "would",
  "could",
  "should",
  "your",
  "you",
  "are",
  "was",
  "were",
  "what",
  "when",
  "where",
  "which",
  "who",
  "why",
  "how",
  "into",
  "onto",
  "over",
  "under",
  "between",
  "than",
  "then",
  "them",
  "these",
  "those",
  "its",
  "it's",
  "our",
  "we",
  "he",
  "she",
  "his",
  "her",
  "i",
  "me",
  "my",
  "mine",
  "a",
  "an",
  "of",
  "to",
  "in",
  "on",
  "at",
  "as",
  "is",
  "be",
  "by",
  "or",
  "if",
  "it",
  "not",
  "but"
]);

function extractKeywords(text) {
  return Array.from(
    new Set(
      text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((word) => word.length > 3 && !STOPWORDS.has(word))
    )
  );
}

function createHighlightSpan(text, highlightId) {
  const span = document.createElement("span");
  span.className = HIGHLIGHT_CLASS;
  span.dataset.highlightId = highlightId;
  span.textContent = text;
  span.title = "Highlighted by WebHighlighter";
  return span;
}

function wrapRangeWithHighlight(range, highlightId) {
  if (range.collapsed) return null;
  const text = range.toString();
  const span = createHighlightSpan(text, highlightId);
  range.deleteContents();
  range.insertNode(span);
  return span;
}

function getSelectionRange() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;
  const range = selection.getRangeAt(0);
  if (!range || range.collapsed) return null;
  return range;
}

function getHighlightButton() {
  let button = document.getElementById(HIGHLIGHT_BUTTON_ID);
  if (!button) {
    button = document.createElement("button");
    button.id = HIGHLIGHT_BUTTON_ID;
    button.textContent = "Highlight";
    button.type = "button";
    button.addEventListener("click", handleCreateHighlight);
    document.body.appendChild(button);
  }
  return button;
}

function showHighlightButton(range) {
  const rect = range.getBoundingClientRect();
  if (!rect) return;
  const button = getHighlightButton();
  button.style.display = "block";
  button.style.top = `${window.scrollY + rect.top - 36}px`;
  button.style.left = `${window.scrollX + rect.left}px`;
}

function hideHighlightButton() {
  const button = document.getElementById(HIGHLIGHT_BUTTON_ID);
  if (button) button.style.display = "none";
}

function saveHighlight(highlight) {
  chrome.storage.local.get({ highlights: [] }, (data) => {
    const highlights = data.highlights;
    highlights.push(highlight);
    chrome.storage.local.set({ highlights }, () => {
      chrome.runtime.sendMessage({ type: "rebuildConnections" });
    });
  });
}

function handleCreateHighlight() {
  const range = getSelectionRange();
  if (!range) {
    hideHighlightButton();
    return;
  }

  const text = range.toString().trim();
  if (!text) {
    hideHighlightButton();
    return;
  }

  const annotationResult = window.prompt("Add a note or annotation (optional):", "");
  if (annotationResult === null) {
    hideHighlightButton();
    return;
  }
  const annotation = annotationResult || "";
  const highlightId = `wh_${Date.now()}_${Math.floor(Math.random() * 100000)}`;

  wrapRangeWithHighlight(range, highlightId);
  window.getSelection()?.removeAllRanges();
  hideHighlightButton();

  const keywords = extractKeywords(`${text} ${annotation}`);
  const highlight = {
    id: highlightId,
    url: window.location.href,
    title: document.title,
    text,
    annotation,
    keywords,
    createdAt: new Date().toISOString()
  };

  saveHighlight(highlight);
}

function handleSelectionChange() {
  const range = getSelectionRange();
  if (!range) {
    hideHighlightButton();
    return;
  }

  if (range.toString().trim().length === 0) {
    hideHighlightButton();
    return;
  }

  showHighlightButton(range);
}

function restoreHighlights() {
  chrome.storage.local.get({ highlights: [] }, (data) => {
    const highlights = data.highlights.filter((item) => item.url === window.location.href);
    if (highlights.length === 0) return;

    highlights.forEach((highlight) => {
      applyHighlightByText(highlight.text, highlight.id);
    });
  });
}

function applyHighlightByText(text, highlightId) {
  if (!text) return;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue || node.nodeValue.trim().length === 0) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });

  while (walker.nextNode()) {
    const node = walker.currentNode;
    const index = node.nodeValue.indexOf(text);
    if (index >= 0) {
      const range = document.createRange();
      range.setStart(node, index);
      range.setEnd(node, index + text.length);
      wrapRangeWithHighlight(range, highlightId);
      return;
    }
  }
}

function handleClickOutside(event) {
  const button = document.getElementById(HIGHLIGHT_BUTTON_ID);
  if (!button) return;
  if (event.target === button) return;
  if (!window.getSelection()?.toString()) hideHighlightButton();
}

function init() {
  document.addEventListener("mouseup", handleSelectionChange);
  document.addEventListener("keyup", handleSelectionChange);
  document.addEventListener("click", handleClickOutside);
  restoreHighlights();
}

init();
