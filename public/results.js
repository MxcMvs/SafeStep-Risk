// results.js

// ---------- Storage helpers ----------
const STORAGE = {
  rated: 'ratedRisks',
  dummy: 'dummyRisks',
  history: 'riskHistory'
};

function loadJSON(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ---------- Data normalization ----------
function uuid() {
  // simple UUID v4-ish
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (crypto.getRandomValues(new Uint8Array(1))[0] & 15);
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function normalizeRisk(r) {
  const nowISO = new Date().toISOString();
  const name = (r && (r.name || r.description)) || 'Unnamed risk';
  const impact = Number(r?.impact ?? r?.severity ?? 1) || 1;
  const likelihood = Number(r?.likelihood ?? r?.probability ?? 1) || 1;
  const score = Number(r?.score ?? impact * likelihood);
  return {
    id: r?.id || uuid(),
    name,
    impact,
    likelihood,
    score,
    mitigation: r?.mitigation || '',
    updatedAt: r?.updatedAt || nowISO
  };
}

// Provide safe defaults if nothing saved yet
function getInitialRisks() {
  let risks = loadJSON(STORAGE.rated)
         || loadJSON(STORAGE.dummy);

  if (!Array.isArray(risks) || risks.length === 0) {
    // default dummy risks (keeps app usable with no API)
    risks = [
      { name: 'Data breach', impact: 5, likelihood: 3, mitigation: 'Encrypt and audit.' },
      { name: 'Downtime', impact: 4, likelihood: 2, mitigation: 'Redundancy + monitoring.' },
      { name: 'Phishing', impact: 3, likelihood: 4, mitigation: 'Training + MFA.' }
    ];
  }

  const normalized = risks.map(normalizeRisk);
  saveJSON(STORAGE.rated, normalized); // ensure stored
  return normalized;
}

// ---------- State ----------
let risks = getInitialRisks();
let chartInstance = null;

// ---------- Rendering ----------
const tbody = document.getElementById('resultsTableBody');
const exportBtn = document.getElementById('exportBtn');
const chartCanvas = document.getElementById('resultsChart');

function riskLevelClass(score) {
  if (score >= 15) return 'high';
  if (score >= 8) return 'medium';
  return 'low';
}

function renderTable() {
  tbody.innerHTML = '';
  risks.forEach(r => {
    const tr = document.createElement('tr');
    tr.setAttribute('data-id', r.id);

    tr.innerHTML = `
      <td>${escapeHtml(r.name)}</td>
      <td>
        <textarea class="mitigationInput" data-id="${r.id}" placeholder="Type mitigation...">${escapeHtml(r.mitigation)}</textarea>
      </td>
      <td>${r.likelihood}</td>
      <td>${r.impact}</td>
      <td class="${riskLevelClass(r.score)}">${r.score}</td>
      <td>${formatDate(r.updatedAt)}</td>
    `;

    tbody.appendChild(tr);
  });

  // Bind live autosave on mitigation
  tbody.querySelectorAll('.mitigationInput').forEach(el => {
    el.addEventListener('input', e => {
      const id = e.target.getAttribute('data-id');
      const r = risks.find(x => x.id === id);
      if (!r) return;
      r.mitigation = e.target.value;
      r.updatedAt = new Date().toISOString();
      saveJSON(STORAGE.rated, risks);
      // optionally append to history (simple journaling)
      appendHistory({ id: r.id, field: 'mitigation', value: r.mitigation, ts: r.updatedAt });
      // refresh updatedAt cell without re-rendering all rows
      const row = e.target.closest('tr');
      if (row) row.children[5].textContent = formatDate(r.updatedAt);
    });
  });
}

function drawChart() {
  if (!chartCanvas) return;

  // destroy prior instance to avoid duplicates
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }

  const labels = risks.map(r => r.name);
  const data = risks.map(r => r.score);
  const bg = risks.map(r => r.score >= 15 ? 'rgba(255, 99, 132, 0.6)'
                    : r.score >= 8 ? 'rgba(255, 159, 64, 0.6)'
                    : 'rgba(75, 192, 192, 0.6)');

  chartInstance = new Chart(chartCanvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Risk Score',
        data,
        backgroundColor: bg
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          callbacks: {
            title: (items) => items[0]?.label || '',
            label: (ctx) => `Score: ${ctx.parsed.y}`
          }
        },
        legend: { display: true }
      },
      scales: {
        x: { title: { display: true, text: 'Risk' } },
        y: { beginAtZero: true, title: { display: true, text: 'Score' } }
      }
    }
  });
}

function renderAll() {
  renderTable();
  drawChart();
}

// ---------- Sorting (filters) ----------
function applyFilter(type) {
  if (type === 'alphabetical') {
    risks.sort((a, b) => a.name.localeCompare(b.name));
  } else if (type === 'score') {
    risks.sort((a, b) => b.score - a.score);
  }
  saveJSON(STORAGE.rated, risks);
  renderAll();
}

// expose for buttons
window.applyFilter = applyFilter;

// ---------- Export PDF (with headings + chart) ----------
async function exportPdf() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt' });

  // Title
  doc.setFontSize(16);
  doc.text('Risk Report', 40, 40);

  // Table
  const head = [['Description', 'Mitigation Plan', 'Likelihood', 'Impact', 'Score', 'Last Time Updated']];
  const body = risks.map(r => [
    r.name,
    r.mitigation || '',
    String(r.likelihood),
    String(r.impact),
    String(r.score),
    formatDate(r.updatedAt)
  ]);

  doc.autoTable({
    startY: 60,
    head,
    body,
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [51, 51, 51] }
  });

  // Ensure chart is up-to-date then add as image
  if (chartInstance) {
    const png = chartCanvas.toDataURL('image/png', 1.0);
    let y = doc.lastAutoTable ? doc.lastAutoTable.finalY + 20 : 60;
    const maxW = 520;  // page width minus margins
    const imgW = Math.min(maxW, 600);
    const imgH = (imgW / chartCanvas.width) * chartCanvas.height;
    doc.text('Risk Scores Overview', 40, y);
    y += 10;
    doc.addImage(png, 'PNG', 40, y, imgW, imgH);
  }

  doc.save('risk-report.pdf');
}

function bindExport() {
  if (exportBtn) exportBtn.addEventListener('click', exportPdf);
}

// ---------- History journaling (kept lightweight, local) ----------
function appendHistory(entry) {
  const hist = loadJSON(STORAGE.history, []);
  hist.push(entry);
  saveJSON(STORAGE.history, hist);
}

// ---------- Utils ----------
function escapeHtml(s) {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  return d.toLocaleString();
}

// ---------- Init ----------
(function init() {
  // recalc scores in case raw data had only impact/likelihood
  risks = risks.map(r => normalizeRisk(r));
  saveJSON(STORAGE.rated, risks);
  renderAll();
  bindExport();
})();
