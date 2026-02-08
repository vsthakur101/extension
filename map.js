const graphContainer = document.getElementById("graph");
const detailsContainer = document.getElementById("details");
const refreshButton = document.getElementById("refresh");

function setDetails(node) {
  if (!node) {
    detailsContainer.className = "details-empty";
    detailsContainer.textContent = "Select a node to see details.";
    return;
  }

  detailsContainer.className = "";
  detailsContainer.innerHTML = `
    <div class="detail-block">
      <h3>Text</h3>
      <p>${node.text}</p>
    </div>
    <div class="detail-block">
      <h3>Annotation</h3>
      <p>${node.annotation || "No annotation"}</p>
    </div>
    <div class="detail-block">
      <h3>Keywords</h3>
      <p>${(node.keywords || []).join(", ") || "None"}</p>
    </div>
    <div class="detail-block">
      <h3>Source</h3>
      <a class="link" href="${node.url}" target="_blank" rel="noreferrer">Open page</a>
    </div>
  `;
}

function renderGraph(highlights, connections) {
  graphContainer.innerHTML = "";
  const width = graphContainer.clientWidth || 900;
  const height = graphContainer.clientHeight || 600;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.max(140, Math.min(width, height) / 2 - 80);

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", String(width));
  svg.setAttribute("height", String(height));
  graphContainer.appendChild(svg);

  const positioned = highlights.map((node, index) => {
    const angle = (Math.PI * 2 * index) / Math.max(1, highlights.length);
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    return { ...node, x, y };
  });

  const nodeById = new Map(positioned.map((node) => [node.id, node]));

  connections.forEach((edge) => {
    const source = nodeById.get(edge.source);
    const target = nodeById.get(edge.target);
    if (!source || !target) return;
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", String(source.x));
    line.setAttribute("y1", String(source.y));
    line.setAttribute("x2", String(target.x));
    line.setAttribute("y2", String(target.y));
    line.setAttribute("stroke", "#334155");
    line.setAttribute("stroke-opacity", "0.7");
    line.setAttribute("stroke-width", String(Math.max(1, edge.score * 6)));
    svg.appendChild(line);
  });

  positioned.forEach((node) => {
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    const size = 12 + Math.min(20, (node.keywords?.length || 0) * 2);
    circle.setAttribute("cx", String(node.x));
    circle.setAttribute("cy", String(node.y));
    circle.setAttribute("r", String(size));
    circle.setAttribute("fill", "#38bdf8");
    circle.setAttribute("stroke", "#0f172a");
    circle.setAttribute("stroke-width", "2");
    circle.addEventListener("click", () => setDetails(node));
    svg.appendChild(circle);

    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    const labelText = node.text.length > 26 ? `${node.text.slice(0, 26)}…` : node.text;
    label.textContent = labelText;
    label.setAttribute("x", String(node.x + size + 4));
    label.setAttribute("y", String(node.y + 4));
    label.setAttribute("fill", "#e2e8f0");
    label.setAttribute("font-size", "11");
    svg.appendChild(label);
  });
}

function loadGraph() {
  chrome.storage.local.get({ highlights: [], connections: [] }, (data) => {
    const highlights = data.highlights || [];
    const connections = data.connections || [];
    if (highlights.length === 0) {
      graphContainer.innerHTML = "<p style='padding:24px;color:#94a3b8;'>No highlights yet.</p>";
      setDetails(null);
      return;
    }
    renderGraph(highlights, connections);
  });
}

refreshButton.addEventListener("click", loadGraph);

loadGraph();
