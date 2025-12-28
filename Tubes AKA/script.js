let chart = null;
let manualChart = null;
let isLogScale = false;

let benchmarkSizes = {
  small: [10, 50, 100, 200, 500, 1000],
  medium: [10, 100, 500, 1000, 2000, 3000, 4000, 5000],
  large: [10, 500, 1000, 2500, 5000, 7500, 10000]
};

function evenIterative(arr) {
  const result = [];
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] % 2 === 0) result.push(arr[i]);
  }
  return result;
}

function evenRecursive(arr, idx = 0) {
  if (idx === arr.length) return [];
  const rest = evenRecursive(arr, idx + 1);
  if (arr[idx] % 2 === 0) rest.unshift(arr[idx]);
  return rest;
}

function generateRandomArray(size, max = 1000) {
  return Array.from({ length: size }, () => Math.floor(Math.random() * max) + 1);
}

function measureAlgorithmTime(algorithm, array) {
  const BASE_LOOPS = 10000;
  const loops = Math.max(10, Math.min(BASE_LOOPS, Math.floor(200000 / (array.length || 1))));
  const start = performance.now();
  for (let i = 0; i < loops; i++) {
    algorithm([...array]);
  }
  return (performance.now() - start) / loops;
}

function processManual() {
  const input = document.getElementById("inputArray").value;
  const outputDiv = document.getElementById("outputManual");

  if (!input.trim()) {
    outputDiv.innerHTML = '<div class="error">⚠️ Masukkan angka terlebih dahulu!</div>';
    return;
  }

  const arr = input.split(",")
    .map(x => parseInt(x.trim()))
    .filter(x => !isNaN(x));

  if (arr.length === 0) {
    outputDiv.innerHTML = '<div class="error">❌ Format input tidak valid!</div>';
    return;
  }

  const evenIter = evenIterative(arr);
  const evenRec = evenRecursive(arr);

  const iterTime = measureAlgorithmTime(evenIterative, arr);
  const recTime = measureAlgorithmTime(evenRecursive, arr);

  outputDiv.innerHTML = `
    <div class="result-output">
      <p><strong>Hasil Bilangan Genap</strong></p>
      <p>Iteratif : ${evenIter.join(", ") || "-"}</p>
      <p>Rekursif : ${evenRec.join(", ") || "-"}</p>
    </div>

    <table class="result-table">
      <tr>
        <th>Algoritma</th>
        <th>Waktu (ms)</th>
        <th>Kompleksitas</th>
      </tr>
      <tr>
        <td>Iteratif</td>
        <td>${iterTime.toFixed(6)}</td>
        <td>O(n)</td>
      </tr>
      <tr>
        <td>Rekursif</td>
        <td>${recTime.toFixed(6)}</td>
        <td>O(n²)</td>
      </tr>
    </table>
  `;

  drawManualChart(iterTime, recTime, arr.length);
}

function runBenchmark() {
  const outputDiv = document.getElementById("outputBenchmark");
  const benchmarkType = document.getElementById("benchmarkType").value;

  outputDiv.innerHTML = `
    <div class="loading">
      <p>⏳ Menjalankan benchmark...</p>
    </div>
  `;

  setTimeout(() => {
    const sizes = benchmarkSizes[benchmarkType];
    const results = { sizes: [], iterTimes: [], recTimes: [] };

    sizes.forEach(size => {
      const arr = generateRandomArray(size);
      results.iterTimes.push(measureAlgorithmTime(evenIterative, arr));
      try {
        results.recTimes.push(measureAlgorithmTime(evenRecursive, arr));
      } catch {
        results.recTimes.push("overflow");
      }
      results.sizes.push(size);
    });

    outputDiv.innerHTML = `
      <div class="success-message">
        ✅ Benchmark selesai! ${sizes.length} ukuran data diuji.
      </div>
    `;

    displayResultTable(results);
    drawChart(results.sizes, results.iterTimes, results.recTimes);
  }, 100);
}

function displayResultTable(results) {
  const tableDiv = document.getElementById("resultTable");

  let tableHTML = `
    <h4>📊 Perbandingan Running Time (ms)</h4>
    <table class="result-table">
      <thead>
        <tr>
          <th>n (Size)</th>
          <th>Iteratif O(n)</th>
          <th>Rekursif O(n²)</th>
          <th>Rasio</th>
        </tr>
      </thead>
      <tbody>
  `;

  results.sizes.forEach((size, i) => {
    const iterTime = results.iterTimes[i];
    const recTime = results.recTimes[i];
    let ratio = "N/A";

    if (typeof recTime === "number") {
      ratio = (recTime / (iterTime || 0.000001)).toFixed(2) + "x";
    }

    tableHTML += `
      <tr>
        <td><strong>${size}</strong></td>
        <td>${iterTime.toFixed(5)}</td>
        <td>${recTime === "overflow" ? 'Overflow' : recTime.toFixed(5)}</td>
        <td>${ratio}</td>
      </tr>
    `;
  });

  tableHTML += `
      </tbody>
    </table>
  `;

  tableDiv.innerHTML = tableHTML;
}

function drawChart(labels, iterData, recData) {
  const ctx = document.getElementById("chart");
  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Iteratif O(n)',
          data: iterData,
          borderColor: '#3498db',
          borderWidth: 3
        },
        {
          label: 'Rekursif O(n²)',
          data: recData.map(v => typeof v === "number" ? v : null),
          borderColor: '#e74c3c',
          borderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { title: { display: true, text: 'Jumlah Data (n)' } },
        y: { type: isLogScale ? 'logarithmic' : 'linear', title: { display: true, text: 'Waktu (ms)' } }
      }
    }
  });
}

function toggleLogScale() {
  isLogScale = !isLogScale;
  if (chart) {
    chart.options.scales.y.type = isLogScale ? 'logarithmic' : 'linear';
    chart.update();
  }
}

function drawManualChart(iterTime, recTime, dataSize) {
  const canvas = document.getElementById("manualChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (manualChart) manualChart.destroy();

  manualChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Iteratif O(n)', 'Rekursif O(n²)'],
      datasets: [{
        label: `Waktu Eksekusi (n = ${dataSize})`,
        data: [iterTime, recTime]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true, title: { display: true, text: 'Waktu (ms)' } }
      }
    }
  });
}
