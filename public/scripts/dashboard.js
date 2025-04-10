// Simple Logistic Regression
class SimpleLogisticRegression {
    constructor(learningRate = 0.01, iterations = 1000) {
        this.learningRate = learningRate;
        this.iterations = iterations;
        this.weights = null;
        this.bias = null;
    }

    sigmoid(z) {
        return 1 / (1 + Math.exp(-z));
    }

    fit(X, y) {
        const nSamples = X.length;
        const nFeatures = X[0].length;
        this.weights = new Array(nFeatures).fill(0);
        this.bias = 0;

        for (let _ = 0; _ < this.iterations; _++) {
            const linearModel = X.map(row => 
                row.reduce((sum, x, i) => sum + x * this.weights[i], this.bias)
            );
            const predictions = linearModel.map(this.sigmoid);

            const dw = new Array(nFeatures).fill(0);
            for (let i = 0; i < nSamples; i++) {
                const error = predictions[i] - y[i];
                for (let j = 0; j < nFeatures; j++) {
                    dw[j] += (error * X[i][j]) / nSamples;
                }
            }
            const db = (predictions.reduce((sum, p, i) => sum + (p - y[i]), 0)) / nSamples;

            this.weights = this.weights.map((w, i) => w - this.learningRate * dw[i]);
            this.bias -= this.learningRate * db;
        }
    }

    predict_proba(X) {
        const linearModel = X.map(row => 
            row.reduce((sum, x, i) => sum + x * this.weights[i], this.bias)
        );
        return linearModel.map(this.sigmoid);
    }
}

// Update chart colors based on dark mode
function updateChartColors() {
    const isDark = document.body.classList.contains('dark-mode');
    const labelColor = isDark ? '#f3f4f6' : '#000';
    [treasuryChart, vixChart, cpiChart, bamlChart].forEach(chart => {
        if (chart) {
            chart.options.plugins.legend.labels.color = labelColor;
            chart.options.scales.x.title.color = labelColor;
            chart.options.scales.y.title.color = labelColor;
            chart.options.scales.x.ticks.color = labelColor;
            chart.options.scales.y.ticks.color = labelColor;
            chart.update();
        }
    });
}

// Data fetching and rendering
async function loadDashboard() {
    const resultElement = document.getElementById('result');

    try {
        // Fetch data from Netlify Function
        const response = await fetch('/.netlify/functions/get-data');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        const { treasury, vix, cpi, baml } = data;

        // Historical data (dummy; replace with real Non-QM data)
        const historicalData = {
            X: [
                [3.5, 20, 271.0, 1.4], // [Treasury, VIX, CPI, BAMLC0A4CBBB]
                [3.6, 22, 271.5, 1.5],
                [3.7, 21, 272.0, 1.6],
                [3.8, 23, 272.5, 1.7],
                [3.9, 25, 273.0, 1.8]
            ],
            y: [1, 0, 1, 1, 0] // 1 = increase, 0 = decrease
        };

        // Train model
        const model = new SimpleLogisticRegression();
        model.fit(historicalData.X, historicalData.y);

        // Current data (most recent values)
        const currentData = [
            treasury.values[0],
            vix.values[0],
            cpi.values[0],
            baml.values[0]
        ];

        // Predict
        const predictionProba = model.predict_proba([currentData])[0];
        const increaseProb = Math.round(predictionProba * 100);

        // Chart options
        const chartOptions = {
            scales: {
                x: { title: { display: true, text: 'Date', color: document.body.classList.contains('dark-mode') ? '#f3f4f6' : '#000' }, ticks: { color: document.body.classList.contains('dark-mode') ? '#f3f4f6' : '#000' } },
                y: { beginAtZero: false, title: { display: true, color: document.body.classList.contains('dark-mode') ? '#f3f4f6' : '#000' }, ticks: { color: document.body.classList.contains('dark-mode') ? '#f3f4f6' : '#000' } }
            },
            plugins: { legend: { labels: { color: document.body.classList.contains('dark-mode') ? '#f3f4f6' : '#000' } } }
        };

        // Render charts
        window.treasuryChart = new Chart(document.getElementById('treasury-chart'), {
            type: 'line',
            data: {
                labels: treasury.dates,
                datasets: [{
                    label: '10Y Treasury Yield (%)',
                    data: treasury.values,
                    borderColor: '#6cebce',
                    backgroundColor: 'rgba(108, 235, 206, 0.2)',
                    fill: true
                }]
            },
            options: { ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, title: { ...chartOptions.scales.y.title, text: 'Yield (%)' } } } }
        });

        window.vixChart = new Chart(document.getElementById('vix-chart'), {
            type: 'line',
            data: {
                labels: vix.dates,
                datasets: [{
                    label: 'VIX Index',
                    data: vix.values,
                    borderColor: '#6cebce',
                    backgroundColor: 'rgba(108, 235, 206, 0.2)',
                    fill: true
                }]
            },
            options: { ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, beginAtZero: true, title: { ...chartOptions.scales.y.title, text: 'Index' } } } }
        });

        window.cpiChart = new Chart(document.getElementById('cpi-chart'), {
            type: 'line',
            data: {
                labels: cpi.dates,
                datasets: [{
                    label: 'CPI Index',
                    data: cpi.values,
                    borderColor: '#6cebce',
                    backgroundColor: 'rgba(108, 235, 206, 0.2)',
                    fill: true
                }]
            },
            options: { ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, title: { ...chartOptions.scales.y.title, text: 'Index' } } } }
        });

        window.bamlChart = new Chart(document.getElementById('baml-chart'), {
            type: 'line',
            data: {
                labels: baml.dates,
                datasets: [{
                    label: 'BBB Spread (%)',
                    data: baml.values,
                    borderColor: '#6cebce',
                    backgroundColor: 'rgba(108, 235, 206, 0.2)',
                    fill: true
                }]
            },
            options: { ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, title: { ...chartOptions.scales.y.title, text: 'Spread (%)' } } } }
        });

        // Display prediction
        resultElement.textContent = `Chance of Non-QM rate increase: ${increaseProb}%`;

        // Update chart colors after rendering
        updateChartColors();
    } catch (error) {
        resultElement.textContent = 'Error loading data. Check console for details.';
        console.error(error);
    }
}

// Load dashboard when the DOM is ready
document.addEventListener('DOMContentLoaded', loadDashboard);

// Update chart colors when dark mode toggles (triggered from header)
document.addEventListener('click', (e) => {
    if (e.target.id === 'dark-mode-toggle') {
        setTimeout(updateChartColors, 0); // Ensure charts update after class toggle
    }
});