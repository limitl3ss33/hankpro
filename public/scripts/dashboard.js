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

    getFeatureImportance() {
        return this.weights;
    }
}

// Update chart colors based on dark mode
function updateChartColors() {
    const isDark = document.body.classList.contains('dark-mode');
    const labelColor = isDark ? '#f3f4f6' : '#000';
    const charts = [treasuryChart, tedSpreadChart, cpiChart, bamlChart, mortgageSpreadChart, unemploymentChart, housingStartsChart, consumerSentimentChart];
    charts.forEach(chart => {
        if (chart) { // Only update if chart exists
            chart.options.plugins.legend.labels.color = labelColor;
            chart.options.scales.x.title.color = labelColor;
            chart.options.scales.y.title.color = labelColor;
            chart.options.scales.x.ticks.color = labelColor;
            chart.options.scales.y.ticks.color = labelColor;
            chart.options.plugins.tooltip.titleFont.color = labelColor;
            chart.options.plugins.tooltip.bodyFont.color = labelColor;
            chart.options.plugins.datalabels.color = labelColor;
            chart.update();
        }
    });
}

// Chart options with enhanced details
const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
        x: { 
            title: { display: true, text: 'Date', color: document.body.classList.contains('dark-mode') ? '#f3f4f6' : '#000' }, 
            ticks: { color: document.body.classList.contains('dark-mode') ? '#f3f4f6' : '#000' } 
        },
        y: { 
            beginAtZero: false, 
            title: { display: true, color: document.body.classList.contains('dark-mode') ? '#f3f4f6' : '#000' }, 
            ticks: { color: document.body.classList.contains('dark-mode') ? '#f3f4f6' : '#000' } 
        }
    },
    plugins: {
        legend: { labels: { color: document.body.classList.contains('dark-mode') ? '#f3f4f6' : '#000' } },
        tooltip: {
            enabled: true,
            titleFont: { size: 14 },
            bodyFont: { size: 12 },
            callbacks: {
                label: (context) => `${context.dataset.label}: ${context.parsed.y.toFixed(2)}`
            }
        },
        datalabels: {
            display: true,
            color: document.body.classList.contains('dark-mode') ? '#f3f4f6' : '#000',
            formatter: (value) => value.toFixed(2),
            anchor: 'end',
            align: 'top'
        }
    }
};

// Chart instances
let treasuryChart, tedSpreadChart, cpiChart, bamlChart, mortgageSpreadChart, unemploymentChart, housingStartsChart, consumerSentimentChart;

// Function to initialize a chart if its container is visible
function initializeChart(chartId, config) {
    const container = document.getElementById(`${chartId}-container`);
    if (container.style.display !== 'none') {
        const canvas = document.getElementById(`${chartId}-chart`);
        if (canvas) {
            return new Chart(canvas, config);
        }
    }
    return null;
}

// Data fetching and rendering
async function loadDashboard(timeFrame = '1month') {
    const resultElement = document.getElementById('result');

    try {
        // Fetch data from Netlify Function with selected time frame
        const response = await fetch(`/.netlify/functions/get-data?timeFrame=${timeFrame}`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        const { treasury, tedSpread, cpi, baml, mortgageSpread, unemployment, housingStarts, consumerSentiment } = data;

        // Adjust labels for 1-day time frame (today vs yesterday)
        const isOneDay = timeFrame === '1day';
        const treasuryLabels = isOneDay ? ['Yesterday', 'Today'] : treasury.dates;
        const tedSpreadLabels = isOneDay ? ['Yesterday', 'Today'] : tedSpread.dates;
        const cpiLabels = isOneDay ? ['Last Month', 'This Month'] : cpi.dates;
        const bamlLabels = isOneDay ? ['Yesterday', 'Today'] : baml.dates;
        const mortgageSpreadLabels = isOneDay ? ['Yesterday', 'Today'] : mortgageSpread.dates;
        const unemploymentLabels = isOneDay ? ['Last Month', 'This Month'] : unemployment.dates;
        const housingStartsLabels = isOneDay ? ['Last Month', 'This Month'] : housingStarts.dates;
        const consumerSentimentLabels = isOneDay ? ['Last Month', 'This Month'] : consumerSentiment.dates;

        // Historical data (replace with real Non-QM rate data)
        const historicalData = {
            X: [
                [3.5, 0.5, 271.0, 1.4, 2.0, 4.0, 1200, 70], // [Treasury, TED Spread, CPI, BBB Spread, Mortgage Spread, Unemployment, Housing Starts, Consumer Sentiment]
                [3.6, 0.6, 271.5, 1.5, 2.1, 4.1, 1210, 71],
                [3.7, 0.7, 272.0, 1.6, 2.2, 4.2, 1220, 72],
                [3.8, 0.8, 272.5, 1.7, 2.3, 4.3, 1230, 73],
                [3.9, 0.9, 273.0, 1.8, 2.4, 4.4, 1240, 74]
            ],
            y: [0, 1, 1, 0, 1] // 1 = increase, 0 = decrease
        };

        // Train model
        const model = new SimpleLogisticRegression();
        model.fit(historicalData.X, historicalData.y);

        // Current data (most recent values)
        const currentData = [
            treasury.values[treasury.values.length - 1],
            tedSpread.values[tedSpread.values.length - 1],
            cpi.values[cpi.values.length - 1],
            baml.values[baml.values.length - 1],
            mortgageSpread.values[mortgageSpread.values.length - 1],
            unemployment.values[unemployment.values.length - 1],
            housingStarts.values[housingStarts.values.length - 1],
            consumerSentiment.values[consumerSentiment.values.length - 1]
        ];

        // Predict
        const predictionProba = model.predict_proba([currentData])[0];
        const increaseProb = Math.round(predictionProba * 100);

        // Get feature importance for reasoning
        const featureImportance = model.getFeatureImportance();
        const features = ['10Y Treasury Yield', 'TED Spread', 'CPI Index', 'BBB Spread', 'Mortgage Market Spread', 'Unemployment Rate', 'Housing Starts', 'Consumer Sentiment'];
        let reasoning = 'The prediction is based on the following market indicators:\n';
        featureImportance.forEach((weight, i) => {
            const value = currentData[i] !== undefined ? currentData[i] : 0; // Fallback to 0 if undefined
            const impact = weight * value;
            const direction = impact > 0 ? 'increases' : 'decreases';
            reasoning += `- ${features[i]} (${value.toFixed(2)}): ${direction} the likelihood of a rate increase (impact: ${impact.toFixed(2)})\n`;
        });

        // Load user preferences from localStorage
        const chartVisibility = JSON.parse(localStorage.getItem('chartVisibility')) || {
            treasury: true,
            tedSpread: true,
            cpi: true,
            baml: true,
            mortgageSpread: true,
            unemployment: true,
            housingStarts: true,
            consumerSentiment: true
        };

        // Initialize charts based on visibility
        treasuryChart = chartVisibility.treasury ? initializeChart('treasury', {
            type: 'line',
            data: {
                labels: treasuryLabels,
                datasets: [{
                    label: '10Y Treasury Yield (%)',
                    data: treasury.values,
                    borderColor: '#6cebce',
                    backgroundColor: 'rgba(108, 235, 206, 0.2)',
                    fill: true
                }]
            },
            options: { ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, title: { ...chartOptions.scales.y.title, text: 'Yield (%)' } } } }
        }) : null;

        tedSpreadChart = chartVisibility.tedSpread ? initializeChart('tedspread', {
            type: 'line',
            data: {
                labels: tedSpreadLabels,
                datasets: [{
                    label: 'TED Spread (%)',
                    data: tedSpread.values,
                    borderColor: '#6cebce',
                    backgroundColor: 'rgba(108, 235, 206, 0.2)',
                    fill: true
                }]
            },
            options: { ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, beginAtZero: true, title: { ...chartOptions.scales.y.title, text: 'Spread (%)' } } } }
        }) : null;

        cpiChart = chartVisibility.cpi ? initializeChart('cpi', {
            type: 'line',
            data: {
                labels: cpiLabels,
                datasets: [{
                    label: 'CPI Index',
                    data: cpi.values,
                    borderColor: '#6cebce',
                    backgroundColor: 'rgba(108, 235, 206, 0.2)',
                    fill: true
                }]
            },
            options: { ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, title: { ...chartOptions.scales.y.title, text: 'Index' } } } }
        }) : null;

        bamlChart = chartVisibility.baml ? initializeChart('baml', {
            type: 'line',
            data: {
                labels: bamlLabels,
                datasets: [{
                    label: 'BBB Spread (%)',
                    data: baml.values,
                    borderColor: '#6cebce',
                    backgroundColor: 'rgba(108, 235, 206, 0.2)',
                    fill: true
                }]
            },
            options: { ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, title: { ...chartOptions.scales.y.title, text: 'Spread (%)' } } } }
        }) : null;

        mortgageSpreadChart = chartVisibility.mortgageSpread ? initializeChart('mortgage-spread', {
            type: 'line',
            data: {
                labels: mortgageSpreadLabels,
                datasets: [{
                    label: 'Mortgage Market Spread (%)',
                    data: mortgageSpread.values,
                    borderColor: '#6cebce',
                    backgroundColor: 'rgba(108, 235, 206, 0.2)',
                    fill: true
                }]
            },
            options: { ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, title: { ...chartOptions.scales.y.title, text: 'Spread (%)' } } } }
        }) : null;

        unemploymentChart = chartVisibility.unemployment ? initializeChart('unemployment', {
            type: 'line',
            data: {
                labels: unemploymentLabels,
                datasets: [{
                    label: 'Unemployment Rate (%)',
                    data: unemployment.values,
                    borderColor: '#6cebce',
                    backgroundColor: 'rgba(108, 235, 206, 0.2)',
                    fill: true
                }]
            },
            options: { ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, title: { ...chartOptions.scales.y.title, text: 'Rate (%)' } } } }
        }) : null;

        housingStartsChart = chartVisibility.housingStarts ? initializeChart('housing-starts', {
            type: 'line',
            data: {
                labels: housingStartsLabels,
                datasets: [{
                    label: 'Housing Starts (Thousands)',
                    data: housingStarts.values,
                    borderColor: '#6cebce',
                    backgroundColor: 'rgba(108, 235, 206, 0.2)',
                    fill: true
                }]
            },
            options: { ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, title: { ...chartOptions.scales.y.title, text: 'Thousands' } } } }
        }) : null;

        consumerSentimentChart = chartVisibility.consumerSentiment ? initializeChart('consumer-sentiment', {
            type: 'line',
            data: {
                labels: consumerSentimentLabels,
                datasets: [{
                    label: 'Consumer Sentiment Index',
                    data: consumerSentiment.values,
                    borderColor: '#6cebce',
                    backgroundColor: 'rgba(108, 235, 206, 0.2)',
                    fill: true
                }]
            },
            options: { ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, title: { ...chartOptions.scales.y.title, text: 'Index' } } } }
        }) : null;

        // Display prediction and reasoning
        resultElement.innerHTML = `
            <h3>Rate Prediction</h3>
            <p>Chance of Non-QM rate increase: ${increaseProb}%</p>
            <p><strong>Reasoning:</strong></p>
            <pre>${reasoning}</pre>
        `;

        // Update chart colors after rendering
        updateChartColors();
    } catch (error) {
        resultElement.textContent = 'Error loading data. Check console for details.';
        console.error(error);
    }
}

// Initialize with default time frame
document.addEventListener('DOMContentLoaded', () => {
    // Load user preferences from localStorage
    const chartVisibility = JSON.parse(localStorage.getItem('chartVisibility')) || {
        treasury: true,
        tedSpread: true,
        cpi: true,
        baml: true,
        mortgageSpread: true,
        unemployment: true,
        housingStarts: true,
        consumerSentiment: true
    };

    // Add chart visibility controls
    const chartControls = document.createElement('div');
    chartControls.className = 'chart-controls';
    chartControls.innerHTML = `
        <h3>Show/Hide Charts</h3>
        <label><input type="checkbox" id="toggle-treasury" ${chartVisibility.treasury ? 'checked' : ''}> 10Y Treasury Yield</label>
        <label><input type="checkbox" id="toggle-tedspread" ${chartVisibility.tedSpread ? 'checked' : ''}> TED Spread</label>
        <label><input type="checkbox" id="toggle-cpi" ${chartVisibility.cpi ? 'checked' : ''}> CPI Index</label>
        <label><input type="checkbox" id="toggle-baml" ${chartVisibility.baml ? 'checked' : ''}> BBB Spread</label>
        <label><input type="checkbox" id="toggle-mortgage-spread" ${chartVisibility.mortgageSpread ? 'checked' : ''}> Mortgage Market Spread</label>
        <label><input type="checkbox" id="toggle-unemployment" ${chartVisibility.unemployment ? 'checked' : ''}> Unemployment Rate</label>
        <label><input type="checkbox" id="toggle-housing-starts" ${chartVisibility.housingStarts ? 'checked' : ''}> Housing Starts</label>
        <label><input type="checkbox" id="toggle-consumer-sentiment" ${chartVisibility.consumerSentiment ? 'checked' : ''}> Consumer Sentiment</label>
    `;
    document.querySelector('.calculator').insertBefore(chartControls, document.querySelector('.time-frame-selector'));

    // Add event listeners for chart visibility toggles
    const toggles = [
        'treasury', 'tedspread', 'cpi', 'baml', 'mortgage-spread', 'unemployment', 'housing-starts', 'consumer-sentiment'
    ];
    toggles.forEach(toggle => {
        document.getElementById(`toggle-${toggle}`).addEventListener('change', (e) => {
            const chartId = toggle.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
            chartVisibility[chartId] = e.target.checked;
            localStorage.setItem('chartVisibility', JSON.stringify(chartVisibility));
            document.getElementById(`${toggle}-container`).style.display = e.target.checked ? 'block' : 'none';
            // Re-render the chart if shown, destroy if hidden
            const chartVar = eval(`${chartId}Chart`);
            if (chartVar) {
                chartVar.destroy();
                eval(`${chartId}Chart = null`);
            }
            if (e.target.checked) {
                const configMap = {
                    treasury: {
                        type: 'line',
                        data: {
                            labels: treasuryLabels,
                            datasets: [{
                                label: '10Y Treasury Yield (%)',
                                data: treasury.values,
                                borderColor: '#6cebce',
                                backgroundColor: 'rgba(108, 235, 206, 0.2)',
                                fill: true
                            }]
                        },
                        options: { ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, title: { ...chartOptions.scales.y.title, text: 'Yield (%)' } } } }
                    },
                    tedspread: {
                        type: 'line',
                        data: {
                            labels: tedSpreadLabels,
                            datasets: [{
                                label: 'TED Spread (%)',
                                data: tedSpread.values,
                                borderColor: '#6cebce',
                                backgroundColor: 'rgba(108, 235, 206, 0.2)',
                                fill: true
                            }]
                        },
                        options: { ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, beginAtZero: true, title: { ...chartOptions.scales.y.title, text: 'Spread (%)' } } } }
                    },
                    cpi: {
                        type: 'line',
                        data: {
                            labels: cpiLabels,
                            datasets: [{
                                label: 'CPI Index',
                                data: cpi.values,
                                borderColor: '#6cebce',
                                backgroundColor: 'rgba(108, 235, 206, 0.2)',
                                fill: true
                            }]
                        },
                        options: { ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, title: { ...chartOptions.scales.y.title, text: 'Index' } } } }
                    },
                    baml: {
                        type: 'line',
                        data: {
                            labels: bamlLabels,
                            datasets: [{
                                label: 'BBB Spread (%)',
                                data: baml.values,
                                borderColor: '#6cebce',
                                backgroundColor: 'rgba(108, 235, 206, 0.2)',
                                fill: true
                            }]
                        },
                        options: { ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, title: { ...chartOptions.scales.y.title, text: 'Spread (%)' } } } }
                    },
                    'mortgage-spread': {
                        type: 'line',
                        data: {
                            labels: mortgageSpreadLabels,
                            datasets: [{
                                label: 'Mortgage Market Spread (%)',
                                data: mortgageSpread.values,
                                borderColor: '#6cebce',
                                backgroundColor: 'rgba(108, 235, 206, 0.2)',
                                fill: true
                            }]
                        },
                        options: { ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, title: { ...chartOptions.scales.y.title, text: 'Spread (%)' } } } }
                    },
                    unemployment: {
                        type: 'line',
                        data: {
                            labels: unemploymentLabels,
                            datasets: [{
                                label: 'Unemployment Rate (%)',
                                data: unemployment.values,
                                borderColor: '#6cebce',
                                backgroundColor: 'rgba(108, 235, 206, 0.2)',
                                fill: true
                            }]
                        },
                        options: { ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, title: { ...chartOptions.scales.y.title, text: 'Rate (%)' } } } }
                    },
                    'housing-starts': {
                        type: 'line',
                        data: {
                            labels: housingStartsLabels,
                            datasets: [{
                                label: 'Housing Starts (Thousands)',
                                data: housingStarts.values,
                                borderColor: '#6cebce',
                                backgroundColor: 'rgba(108, 235, 206, 0.2)',
                                fill: true
                            }]
                        },
                        options: { ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, title: { ...chartOptions.scales.y.title, text: 'Thousands' } } } }
                    },
                    'consumer-sentiment': {
                        type: 'line',
                        data: {
                            labels: consumerSentimentLabels,
                            datasets: [{
                                label: 'Consumer Sentiment Index',
                                data: consumerSentiment.values,
                                borderColor: '#6cebce',
                                backgroundColor: 'rgba(108, 235, 206, 0.2)',
                                fill: true
                            }]
                        },
                        options: { ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, title: { ...chartOptions.scales.y.title, text: 'Index' } } } }
                    }
                };
                if (configMap[chartId]) {
                    eval(`${chartId}Chart = initializeChart('${chartId}', configMap['${chartId}'])`);
                }
            }
            updateChartColors();
        });
    });

    // Set initial visibility
    toggles.forEach(toggle => {
        const chartId = toggle.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
        document.getElementById(`${toggle}-container`).style.display = chartVisibility[chartId] ? 'block' : 'none';
    });

    loadDashboard('1month');

    // Add time frame selector
    const timeFrameSelector = document.createElement('div');
    timeFrameSelector.className = 'time-frame-selector';
    timeFrameSelector.innerHTML = `
        <label for="time-frame">Select Time Frame: </label>
        <select id="time-frame">
            <option value="1day">1 Day</option>
            <option value="3day">3 Days</option>
            <option value="7day">7 Days</option>
            <option value="1month" selected>1 Month</option>
            <option value="3month">3 Months</option>
            <option value="1year">1 Year</option>
            <option value="5year">5 Years</option>
        </select>
    `;
    document.querySelector('.calculator').insertBefore(timeFrameSelector, document.querySelector('.tool-grid'));

    // Add instructions
    const instructions = document.createElement('div');
    instructions.className = 'instructions';
    instructions.innerHTML = `
        <h3>Instructions</h3>
        <p>Welcome to the Rate Prediction Dashboard! This tool helps you analyze market trends and predict Non-QM rate movements. Here's how to use it:</p>
        <ul>
            <li><strong>Show/Hide Charts:</strong> Use the checkboxes above to select which market indicators to display. Your preferences are saved automatically.</li>
            <li><strong>Select a Time Frame:</strong> Use the dropdown menu to choose a time frame (e.g., 1 day, 1 month, 1 year) to view historical data for that period. For the 1-day time frame, it shows today's value compared to yesterday's.</li>
            <li><strong>View Market Indicators:</strong> The charts display up to eight key indicators: 10Y Treasury Yield, TED Spread, CPI Index, BBB Spread, Mortgage Market Spread, Unemployment Rate, Housing Starts, and Consumer Sentiment. Hover over data points for more details.</li>
            <li><strong>Understand the Prediction:</strong> The "Rate Prediction" section shows the likelihood of a Non-QM rate increase, along with reasoning based on the current values of the market indicators.</li>
            <li><strong>Reasoning:</strong> The reasoning explains how each indicator contributes to the prediction. A positive impact increases the likelihood of a rate increase, while a negative impact decreases it.</li>
        </ul>
    `;
    document.querySelector('.calculator').insertBefore(instructions, document.querySelector('.time-frame-selector'));

    // Add event listener for time frame changes
    document.getElementById('time-frame').addEventListener('change', (e) => {
        loadDashboard(e.target.value);
    });
});

// Update chart colors when dark mode toggles (triggered from header)
document.addEventListener('click', (e) => {
    if (e.target.id === 'dark-mode-toggle') {
        setTimeout(updateChartColors, 0);
    }
});
