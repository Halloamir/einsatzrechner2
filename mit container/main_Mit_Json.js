function showStep2Overview() {
  let full = document.getElementById("fulltime").value || 0;
  let part20 = document.getElementById("parttime20").value || 0;
  let part = document.getElementById("parttime").value || 0;
  let mode = document.querySelector('input[name="mode"]:checked').value;
  let groupText = "";
  let groupValue = "";
  if (mode === "group") {
    let groupSelect = document.getElementById("group");
    let selectedOption = groupSelect.options[groupSelect.selectedIndex];
    groupText = selectedOption ? selectedOption.text : "";
    groupValue = selectedOption ? selectedOption.value : "";
  } else if (mode === "wz" || mode === "branche") {
    let subSelect = document.getElementById("subbranche");
    let selectedOption = subSelect.options[subSelect.selectedIndex];
    groupText = selectedOption ? selectedOption.text : "";
    groupValue = selectedOption ? selectedOption.value : "";
  }
  document.getElementById("step2-overview").innerHTML = `
    <div style="text-align:center; margin-bottom:14px; font-weight:600; color:#14212b; font-size:1.12em;">Ihre Eingaben</div>
    <div class="result-row">
      <div class="result-tile"><strong>Vollzeit-Beschäftigte</strong><span>${full}</span></div>
      <div class="result-tile"><strong>Teilzeit &gt; 20h</strong><span>${part20}</span></div>
      <div class="result-tile"><strong>Teilzeit &lt; 20h</strong><span>${part}</span></div>
    </div>
    <div class="result-tile result-tile-full"><strong>Betreuungsgruppe</strong><span>${groupText} (${groupValue} h)</span></div>
  `;
}
const { jsPDF } = window.jspdf;

let chartInstance;
let subbranchenData = {};
// Subbranchen aus JSON laden
fetch("subbranchen.json")
  .then((r) => r.json())
  .then((data) => {
    subbranchenData = data;
    updateSubbranche(); // Dropdown erst befüllen, wenn Daten geladen sind
  });

function switchMode() {
  const mode = document.querySelector('input[name="mode"]:checked').value;
  document
    .querySelectorAll(".mode-container")
    .forEach((el) => (el.style.display = "none"));
  document.getElementById("mode-" + mode).style.display = "block";
}

function updateGroupByWZ() {
  const wz = document.getElementById("wzcode").value;
  // Hier kannst du die Gruppe automatisch setzen, falls gewünscht
  // z.B. document.getElementById("group").value = wzMapping[wz] || "";
}

function updateSubbranche() {
  const branche = document.getElementById("branche").value;
  const subSelect = document.getElementById("subbranche");
  subSelect.innerHTML = "";

  // Immer zuerst "Bitte wählen" einfügen
  let firstOption = document.createElement("option");
  firstOption.value = "";
  firstOption.textContent = "Bitte wählen";
  subSelect.appendChild(firstOption);

  const options = subbranchenData[branche] || [];
  if (options.length > 0) {
    options.forEach((opt) => {
      let o = document.createElement("option");
      o.value = opt.value;
      o.textContent = opt.text;
      subSelect.appendChild(o);
    });
  } else {
    let o = document.createElement("option");
    o.textContent = "Noch keine Daten eingetragen";
    o.value = "";
    subSelect.appendChild(o);
  }
}

function nextStep(step) {
  document
    .querySelectorAll(".step")
    .forEach((s) => s.classList.remove("active"));
  document.getElementById("step" + step).classList.add("active");
  for (let i = 1; i <= 3; i++)
    document.getElementById("progress" + i).classList.remove("active");
  document.getElementById("progress" + step).classList.add("active");
  if (step === 2) {
    showStep2Overview();
  }
}

function prevStep(step) {
  nextStep(step);
}

function calculate() {
  let full = parseInt(document.getElementById("fulltime").value) || 0;
  let part20 = parseInt(document.getElementById("parttime20").value) || 0;
  let part = parseInt(document.getElementById("parttime").value) || 0;
  const mode = document.querySelector('input[name="mode"]:checked').value;

  let groupFactor = 1.5; // default
  if (mode === "group") {
    groupFactor = parseFloat(document.getElementById("group").value);
  } else if (mode === "wz" || mode === "branche") {
    const subValue = document.getElementById("subbranche").value;
    if (!subValue) {
      alert("Bitte wählen Sie eine spezifische Betriebsart aus.");
      return;
    }
    groupFactor = parseFloat(subValue);
  }

  let employees = full + part20 * 0.75 + part * 0.5;
  let totalHours = employees * groupFactor;
  let sifaPercent =
    parseFloat(document.getElementById("sifaPercent").value) || 80;
  let doctorPercent =
    parseFloat(document.getElementById("doctorPercent").value) || 20;
  if (sifaPercent + doctorPercent !== 100) {
    // Automatisch anpassen, falls Summe nicht 100
    doctorPercent = 100 - sifaPercent;
    document.getElementById("doctorPercent").value = doctorPercent;
  }
  let sifaHours = totalHours * (sifaPercent / 100);
  let doctorHours = totalHours * (doctorPercent / 100);

  showResults(employees, totalHours, sifaHours, doctorHours);
  drawChart(sifaHours, doctorHours);
  nextStep(3);
}

function showResults(employees, totalHours, sifaHours, doctorHours) {
  document.getElementById("results").innerHTML = `
    <div class="result-row">
      <div class="result-tile"><strong>Beschäftigte (VZ-Äquivalent)</strong><span>${employees.toFixed(
        2
      )}</span></div>
      <div class="result-tile"><strong>Gesamtstunden Grundbetreuung</strong><span>${totalHours.toFixed(
        2
      )} h/Jahr</span></div>
    </div>
    <div class="result-row">
      <div class="result-tile"><strong>Fachkraft für Arbeitssicherheit</strong><span>${sifaHours.toFixed(
        2
      )} h/Jahr</span></div>
      <div class="result-tile"><strong>Betriebsarzt</strong><span>${doctorHours.toFixed(
        2
      )} h/Jahr</span></div>
    </div>
  `;
}

function updateResultSplit() {
  // Hole die Werte aus den Inputs
  let sifaPercent =
    parseFloat(document.getElementById("sifaPercent").value) || 80;
  let doctorPercent = 100 - sifaPercent;
  document.getElementById("doctorPercent").value = doctorPercent;
  let full = parseInt(document.getElementById("fulltime").value) || 0;
  let part20 = parseInt(document.getElementById("parttime20").value) || 0;
  let part = parseInt(document.getElementById("parttime").value) || 0;
  const mode = document.querySelector('input[name="mode"]:checked').value;
  let groupFactor =
    mode === "branche"
      ? parseFloat(document.getElementById("subbranche").value)
      : parseFloat(document.getElementById("group").value);
  let employees = full + part20 * 0.75 + part * 0.5;
  let totalHours = employees * groupFactor;
  let sifaHours = totalHours * (sifaPercent / 100);
  let doctorHours = totalHours * (doctorPercent / 100);
  showResults(employees, totalHours, sifaHours, doctorHours);
  drawChart(sifaHours, doctorHours);
}

function drawChart(sifa, arzt) {
  const ctx = document.getElementById("chart").getContext("2d");
  if (chartInstance) chartInstance.destroy();
  chartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Fachkraft für Arbeitssicherheit", "Betriebsarzt"],
      datasets: [
        {
          label: "Stunden",
          data: [sifa, arzt],
          backgroundColor: ["#77a4b2", "#f5a97f"],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Stunden pro Jahr",
          },
        },
      },
    },
  });
}

function exportPDF() {
  const doc = new jsPDF();
  doc.setFont("Nunito Sans");
  doc.setFontSize(16);
  doc.text("Einsatzzeitenrechner DGUV V2", 10, 20);
  const full = document.getElementById("fulltime").value || 0;
  const part20 = document.getElementById("parttime20").value || 0;
  const part = document.getElementById("parttime").value || 0;
  const mode = document.querySelector('input[name="mode"]:checked').value;
  const group =
    mode === "branche"
      ? document.getElementById("subbranche").value
      : document.getElementById("group").value;
  doc.setFontSize(12);
  doc.text(`Vollzeit-Beschäftigte: ${full}`, 10, 40);
  doc.text(`Teilzeit > 20h: ${part20}`, 10, 50);
  doc.text(`Teilzeit < 20h: ${part}`, 10, 60);
  doc.text(`Betreuungsgruppe: ${group}`, 10, 70);
  const resultText = document.getElementById("results").innerText;
  doc.text(resultText, 10, 90);
  doc.save("einsatzzeiten.pdf");
}
