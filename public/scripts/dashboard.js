// Enhanced Logistic Regression Model
class EnhancedLogisticRegression {
    constructor(learningRate = 0.01, iterations = 1000, regularization = 0.01) {
        this.learningRate = learningRate;
        this.iterations = iterations;
        this.regularization = regularization; // L2 regularization parameter
        this.weights = null;
        this.bias = null;
        this.featureImportance = null;
    }

    sigmoid(z) {
        return 1 / (1 + Math.exp(-z));
    }

    // Normalize feature data to improve model training
    normalize(X) {
        const nSamples = X.length;
        const nFeatures = X[0].length;
        const normalized = new Array(nSamples).fill(0).map(() => new Array(nFeatures).fill(0));
        this.means = new Array(nFeatures).fill(0);
        this.stds = new Array(nFeatures).fill(0);
        
        // Calculate means
        for (let j = 0; j < nFeatures; j++) {
            let sum = 0;
            for (let i = 0; i < nSamples; i++) {
                sum += X[i][j];
            }
            this.means[j] = sum / nSamples;
        }
        
        // Calculate standard deviations
        for (let j = 0; j < nFeatures; j++) {
            let sumSquaredDiff = 0;
            for (let i = 0; i < nSamples; i++) {
                sumSquaredDiff += Math.pow(X[i][j] - this.means[j], 2);
            }
            this.stds[j] = Math.sqrt(sumSquaredDiff / nSamples);
            // Prevent division by zero
            if (this.stds[j] === 0) this.stds[j] = 1;
        }
        
        // Normalize the data
        for (let i = 0; i < nSamples; i++) {
            for (let j = 0; j < nFeatures; j++) {
                normalized[i][j] = (X[i][j] - this.means[j]) / this.stds[j];
            }
        }
        
        return normalized;
    }
    
    // Normalize a single sample (for prediction)
    normalizeSample(sample) {
        if (!this.means || !this.stds) {
            console.error("Model was not fit with normalization");
            return sample;
        }
        
        const normalized = new Array(sample.length).fill(0);
        for (let j = 0; j < sample.length; j++) {
            normalized[j] = (sample[j] - this.means[j]) / this.stds[j];
        }
        return normalized;
    }

    fit(X, y) {
        const normalizedX = this.normalize(X);
        const nSamples = normalizedX.length;
        const nFeatures = normalizedX[0].length;
        
        this.weights = new Array(nFeatures).fill(0);
        this.bias = 0;
        
        // Initialize feature importance
        this.featureImportance = new Array(nFeatures).fill(0);

        // Training loop
        for (let iter = 0; iter < this.iterations; iter++) {
            // Forward pass
            const linearModel = normalizedX.map(row => 
                row.reduce((sum, x, i) => sum + x * this.weights[i], this.bias)
            );
            const predictions = linearModel.map(this.sigmoid);
            
            // Compute gradients with L2 regularization
            const dw = new Array(nFeatures).fill(0);
            for (let i = 0; i < nSamples; i++) {
                const error = predictions[i] - y[i];
                for (let j = 0; j < nFeatures; j++) {
                    dw[j] += (error * normalizedX[i][j]) / nSamples;
                }
            }
            
            // Add regularization term to gradients
            for (let j = 0; j < nFeatures; j++) {
                dw[j] += (this.regularization * this.weights[j]) / nSamples;
            }
            
            const db = predictions.reduce((sum, p, i) => sum + (p - y[i]), 0) / nSamples;
            
            // Update weights and bias
            for (let j = 0; j < nFeatures; j++) {
                this.weights[j] -= this.learningRate * dw[j];
            }
            this.bias -= this.learningRate * db;
        }
        
        // Calculate feature importance based on the magnitude of weights
        for (let j = 0; j < nFeatures; j++) {
            this.featureImportance[j] = Math.abs(this.weights[j]);
        }
        
        // Normalize feature importance
        const sumImportance = this.featureImportance.reduce((sum, val) => sum + val, 0);
        if (sumImportance > 0) {
            this.featureImportance = this.featureImportance.map(val => val / sumImportance);
        }
    }

    predict_proba(X) {
        if (!Array.isArray(X[0])) {
            // If X is a single sample, convert it to a 2D array
            X = [X];
        }
        
        // Normalize input features
        const normalizedX = X.map(sample => this.normalizeSample(sample));
        
        const linearModel = normalizedX.map(row => 
            row.reduce((sum, x, i) => sum + x * this.weights[i], this.bias)
        );
        return linearModel.map(this.sigmoid);
    }

    getFeatureImportance() {
        return this.featureImportance;
    }
    
    getWeights() {
        return this.weights;
    }
    
    getBias() {
        return this.bias;
    }
}
// Cache for historical data to avoid unnecessary API calls
const dataCache = {
    timeFrame: null,
    timestamp: null,
    data: null,
    // Cache expires after 15 minutes
    isExpired: function() {
        if (!this.timestamp) return true;
        const cacheTime = 15 * 60 * 1000; // 15 minutes in milliseconds
        return (Date.now() - this.timestamp) > cacheTime;
    },
    set: function(timeFrame, data) {
        this.timeFrame = timeFrame;
        this.timestamp = Date.now();
        this.data = data;
    },
    get: function(timeFrame) {
        if (this.timeFrame === timeFrame && !this.isExpired()) {
            return this.data;
        }
        return null;
    }
};

// Chart style configuration
const getChartOptions = (isDarkMode, yAxisTitle) => {
    const labelColor = isDarkMode ? '#f3f4f6' : '#000';
    const gridColor = isDarkMode ? '#4b5563' : '#e5e7eb';
    const backgroundColor = isDarkMode ? '#374151' : '#f8fafc';
    
    return {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
            padding: {
                top: 20,
                right: 20,
                bottom: 10,
                left: 10
            }
        },
        scales: {
            x: { 
                title: { 
                    display: true, 
                    text: 'Date', 
                    color: labelColor 
                }, 
                ticks: { 
                    color: labelColor,
                    maxRotation: 45,
                    minRotation: 45
                },
                grid: {
                    color: gridColor
                }
            },
            y: { 
                beginAtZero: false, 
                title: { 
                    display: true, 
                    text: yAxisTitle, 
                    color: labelColor 
                }, 
                ticks: { 
                    color: labelColor,
                    precision: 2
                },
                grid: {
                    color: gridColor
                }
            }
        },
        plugins: {
            legend: { 
                display: true,
                labels: { 
                    color: labelColor,
                    boxWidth: 12,
                    padding: 10
                }
            },
            tooltip: {
                enabled: true,
                backgroundColor: isDarkMode ? '#1f2937' : '#fff',
                titleColor: labelColor,
                bodyColor: labelColor,
                borderColor: isDarkMode ? '#6b7280' : '#e5e7eb',
                borderWidth: 1,
                padding: 10,
                cornerRadius: 6,
                displayColors: true,
                callbacks: {
                    label: (context) => {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        label += context.parsed.y.toFixed(2);
                        return label;
                    }
                }
            },
            datalabels: {
                display: false, // Only show data labels on hover
                color: labelColor,
                formatter: (value) => value.toFixed(2),
                anchor: 'end',
                align: 'top'
            }
        },
        interaction: {
            mode: 'index',
            intersect: false
        },
        elements: {
            point: {
                radius: 3,
                hoverRadius: 5
            },
            line: {
                tension: 0.4
            }
        },
        animation: {
            duration: 1000,
            easing: 'easeOutQuart'
        }
    };
};

// Chart instances
let treasuryChart, tedSpreadChart, cpiChart, bamlChart, mortgageSpreadChart, 
    unemploymentChart, housingStartsChart, consumerSentimentChart;

// Chart data
let treasury, tedSpread, cpi, baml, mortgageSpread, unemployment, housingStarts, consumerSentiment;

// Training data for model
let trainingData = {
    // Historical data with real correlation values (approximated)
    X: [],
    y: []
};

// Tracker for visible charts
let chartVisibility = {};

// Initialize chart instances
function initializeChart(chartId, config) {
    const canvas = document.getElementById(`${chartId}-chart`);
    if (canvas) {
        // Destroy existing chart if it exists
        const existingChartInstance = Chart.getChart(canvas);
        if (existingChartInstance) {
            existingChartInstance.destroy();
        }
        return new Chart(canvas, config);
    }
    return null;
}
// Update chart colors based on dark mode
function updateChartColors() {
    const isDark = document.body.classList.contains('dark-mode');
    
    // Define chart configurations with updated options
    const chartConfigs = {
        treasury: {
            type: 'line',
            data: {
                labels: treasury?.dates || [],
                datasets: [{
                    label: '10Y Treasury Yield (%)',
                    data: treasury?.values || [],
                    borderColor: isDark ? '#6cebce' : '#0891b2',
                    backgroundColor: isDark ? 'rgba(108, 235, 206, 0.2)' : 'rgba(8, 145, 178, 0.1)',
                    fill: true
                }]
            },
            options: getChartOptions(isDark, 'Yield (%)')
        },
        tedspread: {
            type: 'line',
            data: {
                labels: tedSpread?.dates || [],
                datasets: [{
                    label: 'TED Spread (%)',
                    data: tedSpread?.values || [],
                    borderColor: isDark ? '#6cebce' : '#0891b2',
                    backgroundColor: isDark ? 'rgba(108, 235, 206, 0.2)' : 'rgba(8, 145, 178, 0.1)',
                    fill: true
                }]
            },
            options: getChartOptions(isDark, 'Spread (%)')
        },
        cpi: {
            type: 'line',
            data: {
                labels: cpi?.dates || [],
                datasets: [{
                    label: 'CPI Index',
                    data: cpi?.values || [],
                    borderColor: isDark ? '#6cebce' : '#0891b2',
                    backgroundColor: isDark ? 'rgba(108, 235, 206, 0.2)' : 'rgba(8, 145, 178, 0.1)',
                    fill: true
                }]
            },
            options: getChartOptions(isDark, 'Index')
        },
        baml: {
            type: 'line',
            data: {
                labels: baml?.dates || [],
                datasets: [{
                    label: 'BBB Spread (%)',
                    data: baml?.values || [],
                    borderColor: isDark ? '#6cebce' : '#0891b2',
                    backgroundColor: isDark ? 'rgba(108, 235, 206, 0.2)' : 'rgba(8, 145, 178, 0.1)',
                    fill: true
                }]
            },
            options: getChartOptions(isDark, 'Spread (%)')
        },
        'mortgage-spread': {
            type: 'line',
            data: {
                labels: mortgageSpread?.dates || [],
                datasets: [{
                    label: 'Mortgage Market Spread (%)',
                    data: mortgageSpread?.values || [],
                    borderColor: isDark ? '#6cebce' : '#0891b2',
                    backgroundColor: isDark ? 'rgba(108, 235, 206, 0.2)' : 'rgba(8, 145, 178, 0.1)',
                    fill: true
                }]
            },
            options: getChartOptions(isDark, 'Spread (%)')
        },
        unemployment: {
            type: 'line',
            data: {
                labels: unemployment?.dates || [],
                datasets: [{
                    label: 'Unemployment Rate (%)',
                    data: unemployment?.values || [],
                    borderColor: isDark ? '#6cebce' : '#0891b2',
                    backgroundColor: isDark ? 'rgba(108, 235, 206, 0.2)' : 'rgba(8, 145, 178, 0.1)',
                    fill: true
                }]
            },
            options: getChartOptions(isDark, 'Rate (%)')
        },
        'housing-starts': {
            type: 'line',
            data: {
                labels: housingStarts?.dates || [],
                datasets: [{
                    label: 'Housing Starts (Thousands)',
                    data: housingStarts?.values || [],
                    borderColor: isDark ? '#6cebce' : '#0891b2',
                    backgroundColor: isDark ? 'rgba(108, 235, 206, 0.2)' : 'rgba(8, 145, 178, 0.1)',
                    fill: true
                }]
            },
            options: getChartOptions(isDark, 'Thousands')
        },
        'consumer-sentiment': {
            type: 'line',
            data: {
                labels: consumerSentiment?.dates || [],
                datasets: [{
                    label: 'Consumer Sentiment Index',
                    data: consumerSentiment?.values || [],
                    borderColor: isDark ? '#6cebce' : '#0891b2',
                    backgroundColor: isDark ? 'rgba(108, 235, 206, 0.2)' : 'rgba(8, 145, 178, 0.1)',
                    fill: true
                }]
            },
            options: getChartOptions(isDark, 'Index')
        }
    };
    
    // Update charts based on visibility
    if (chartVisibility.treasury && treasuryChart) {
        treasuryChart = initializeChart('treasury', chartConfigs.treasury);
    }
    if (chartVisibility.tedSpread && tedSpreadChart) {
        tedSpreadChart = initializeChart('tedspread', chartConfigs.tedspread);
    }
    if (chartVisibility.cpi && cpiChart) {
        cpiChart = initializeChart('cpi', chartConfigs.cpi);
    }
    if (chartVisibility.baml && bamlChart) {
        bamlChart = initializeChart('baml', chartConfigs.baml);
    }
    if (chartVisibility.mortgageSpread && mortgageSpreadChart) {
        mortgageSpreadChart = initializeChart('mortgage-spread', chartConfigs['mortgage-spread']);
    }
    if (chartVisibility.unemployment && unemploymentChart) {
        unemploymentChart = initializeChart('unemployment', chartConfigs.unemployment);
    }
    if (chartVisibility.housingStarts && housingStartsChart) {
        housingStartsChart = initializeChart('housing-starts', chartConfigs['housing-starts']);
    }
    if (chartVisibility.consumerSentiment && consumerSentimentChart) {
        consumerSentimentChart = initializeChart('consumer-sentiment', chartConfigs['consumer-sentiment']);
    }
}

// Toggle chart visibility
function toggleChart(chartId, isVisible) {
    const normalizedChartId = chartId.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    chartVisibility[normalizedChartId] = isVisible;
    
    // Save visibility settings to localStorage
    localStorage.setItem('chartVisibility', JSON.stringify(chartVisibility));
    
    // Show/hide chart container
    document.getElementById(`${chartId}-container`).style.display = isVisible ? 'block' : 'none';
    
    // Update chart if it's now visible or destroy if hidden
    if (isVisible) {
        const isDark = document.body.classList.contains('dark-mode');
        const chartConfigs = {
            treasury: {
                type: 'line',
                data: {
                    labels: treasury?.dates || [],
                    datasets: [{
                        label: '10Y Treasury Yield (%)',
                        data: treasury?.values || [],
                        borderColor: isDark ? '#6cebce' : '#0891b2',
                        backgroundColor: isDark ? 'rgba(108, 235, 206, 0.2)' : 'rgba(8, 145, 178, 0.1)',
                        fill: true
                    }]
                },
                options: getChartOptions(isDark, 'Yield (%)')
            },
            tedspread: {
                type: 'line',
                data: {
                    labels: tedSpread?.dates || [],
                    datasets: [{
                        label: 'TED Spread (%)',
                        data: tedSpread?.values || [],
                        borderColor: isDark ? '#6cebce' : '#0891b2',
                        backgroundColor: isDark ? 'rgba(108, 235, 206, 0.2)' : 'rgba(8, 145, 178, 0.1)',
                        fill: true
                    }]
                },
                options: getChartOptions(isDark, 'Spread (%)')
            },
            cpi: {
                type: 'line',
                data: {
                    labels: cpi?.dates || [],
                    datasets: [{
                        label: 'CPI Index',
                        data: cpi?.values || [],
                        borderColor: isDark ? '#6cebce' : '#0891b2',
                        backgroundColor: isDark ? 'rgba(108, 235, 206, 0.2)' : 'rgba(8, 145, 178, 0.1)',
                        fill: true
                    }]
                },
                options: getChartOptions(isDark, 'Index')
            },
            baml: {
                type: 'line',
                data: {
                    labels: baml?.dates || [],
                    datasets: [{
                        label: 'BBB Spread (%)',
                        data: baml?.values || [],
                        borderColor: isDark ? '#6cebce' : '#0891b2',
                        backgroundColor: isDark ? 'rgba(108, 235, 206, 0.2)' : 'rgba(8, 145, 178, 0.1)',
                        fill: true
                    }]
                },
                options: getChartOptions(isDark, 'Spread (%)')
            },
            'mortgage-spread': {
                type: 'line',
                data: {
                    labels: mortgageSpread?.dates || [],
                    datasets: [{
                        label: 'Mortgage Market Spread (%)',
                        data: mortgageSpread?.values || [],
                        borderColor: isDark ? '#6cebce' : '#0891b2',
                        backgroundColor: isDark ? 'rgba(108, 235, 206, 0.2)' : 'rgba(8, 145, 178, 0.1)',
                        fill: true
                    }]
                },
                options: getChartOptions(isDark, 'Spread (%)')
            },
            unemployment: {
                type: 'line',
                data: {
                    labels: unemployment?.dates || [],
                    datasets: [{
                        label: 'Unemployment Rate (%)',
                        data: unemployment?.values || [],
                        borderColor: isDark ? '#6cebce' : '#0891b2',
                        backgroundColor: isDark ? 'rgba(108, 235, 206, 0.2)' : 'rgba(8, 145, 178, 0.1)',
                        fill: true
                    }]
                },
                options: getChartOptions(isDark, 'Rate (%)')
            },
            'housing-starts': {
                type: 'line',
                data: {
                    labels: housingStarts?.dates || [],
                    datasets: [{
                        label: 'Housing Starts (Thousands)',
                        data: housingStarts?.values || [],
                        borderColor: isDark ? '#6cebce' : '#0891b2',
                        backgroundColor: isDark ? 'rgba(108, 235, 206, 0.2)' : 'rgba(8, 145, 178, 0.1)',
                        fill: true
                    }]
                },
                options: getChartOptions(isDark, 'Thousands')
            },
            'consumer-sentiment': {
                type: 'line',
                data: {
                    labels: consumerSentiment?.dates || [],
                    datasets: [{
                        label: 'Consumer Sentiment Index',
                        data: consumerSentiment?.values || [],
                        borderColor: isDark ? '#6cebce' : '#0891b2',
                        backgroundColor: isDark ? 'rgba(108, 235, 206, 0.2)' : 'rgba(8, 145, 178, 0.1)',
                        fill: true
                    }]
                },
                options: getChartOptions(isDark, 'Index')
            }
        };
        
        // Initialize the appropriate chart based on chartId
        eval(`${normalizedChartId}Chart = initializeChart('${chartId}', chartConfigs['${chartId}'])`);
    } else {
        // Destroy the chart if it exists
        const chartInstance = eval(`${normalizedChartId}Chart`);
        if (chartInstance) {
            chartInstance.destroy();
            eval(`${normalizedChartId}Chart = null`);
        }
    }
}
// Function to load dashboard data and render
async function loadDashboard(timeFrame = '1month') {
    const resultElement = document.getElementById('result');
    const updateTimestamp = document.getElementById('update-timestamp');
    const predictionPercentage = document.getElementById('prediction-percentage');
    const trendText = document.getElementById('trend-text');
    const factorBars = document.getElementById('factor-bars');
    
    try {
        // Check cache first
        const cachedData = dataCache.get(timeFrame);
        if (cachedData) {
            console.log('Using cached data for timeFrame:', timeFrame);
            processData(cachedData, timeFrame);
            return;
        }
        
        // Show loading state
        resultElement.innerHTML = '<p>Loading latest market data...</p>';
        predictionPercentage.textContent = 'Loading...';
        trendText.textContent = 'Analyzing market trends...';
        factorBars.innerHTML = '<div class="loading-bars"></div>';
        
        // Fetch data from Netlify Function with selected time frame
        const response = await fetch(`/.netlify/functions/get-data?timeFrame=${timeFrame}`, {
            headers: {
                'Cache-Control': 'no-cache' // Prevent browser caching
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Fetched data:', data);
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        // Cache the data
        dataCache.set(timeFrame, data);
        
        // Process and display the data
        processData(data, timeFrame);
        
        // Update timestamp
        const now = new Date();
        updateTimestamp.textContent = now.toLocaleString();
        
    } catch (error) {
        console.error('Error loading data:', error);
        resultElement.innerHTML = `
            <p>Error loading data: ${error.message}</p>
            <p>Please try again later or contact support if the problem persists.</p>
        `;
        predictionPercentage.textContent = 'Error';
        trendText.textContent = 'Unable to analyze trends due to data loading error.';
        factorBars.innerHTML = '';
    }
}
// Process the data and update UI
function processData(data, timeFrame) {
    // Extract data
    ({ treasury, tedSpread, cpi, baml, mortgageSpread, unemployment, housingStarts, consumerSentiment } = data);
    
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
    
    // Training data from synthetic historical correlations
    // In a real application, this would be replaced with actual historical NON-QM rate changes
    if (trainingData.X.length === 0) {
        // Generate more realistic training data with known correlations
        // Each array is [Treasury, TED Spread, CPI, BBB Spread, Mortgage Spread, Unemployment, Housing Starts, Consumer Sentiment]
        // Positive correlation with Treasury, BBB Spread, Mortgage Spread
        // Negative correlation with Housing Starts, Consumer Sentiment
        // Weak correlation with TED Spread, CPI, Unemployment
        trainingData = {
            X: [
                [3.5, 0.5, 271.0, 1.4, 2.0, 4.0, 1200, 70], // Decrease (low treasury and spreads)
                [3.6, 0.4, 271.2, 1.3, 1.9, 4.1, 1250, 72], // Decrease (housing starts up, sentiment up)
                [3.7, 0.6, 271.6, 1.5, 2.1, 4.0, 1240, 71], // No change
                [3.9, 0.7, 272.0, 1.7, 2.3, 3.9, 1230, 69], // Increase (treasury up, spreads up)
                [4.0, 0.8, 272.5, 1.8, 2.5, 3.8, 1220, 68], // Increase (treasury up, spreads up, sentiment down)
                [3.8, 0.7, 273.0, 1.6, 2.2, 3.9, 1260, 73], // Decrease (housing starts up, sentiment up)
                [3.7, 0.6, 273.2, 1.5, 2.0, 4.0, 1280, 75], // Decrease (housing starts up, sentiment up)
                [3.9, 0.8, 273.5, 1.7, 2.4, 4.1, 1210, 67], // Increase (treasury up, spreads up, sentiment down)
                [4.1, 0.9, 274.0, 1.9, 2.6, 4.2, 1190, 65], // Increase (treasury up, spreads up, housing down)
                [4.0, 0.8, 274.2, 1.8, 2.5, 4.3, 1220, 66], // No change
                [3.8, 0.7, 274.5, 1.6, 2.1, 4.4, 1260, 69], // Decrease (housing starts up)
                [3.6, 0.5, 275.0, 1.4, 1.9, 4.5, 1290, 72], // Decrease (low treasury and spreads, housing up)
                [3.8, 0.6, 275.5, 1.5, 2.0, 4.4, 1270, 71], // No change
                [4.0, 0.7, 276.0, 1.7, 2.3, 4.3, 1240, 68], // Increase (treasury up, spreads up)
                [4.2, 0.8, 276.5, 1.9, 2.7, 4.2, 1200, 64]  // Increase (treasury up, spreads up, housing down, sentiment down)
            ],
            y: [0, 0, 0.5, 1, 1, 0, 0, 1, 1, 0.5, 0, 0, 0.5, 1, 1] // 1 = increase, 0 = decrease, 0.5 = no change
        };
    }
    
    // Train model
    const model = new EnhancedLogisticRegression(0.01, 2000, 0.01);
    model.fit(trainingData.X, trainingData.y);
    
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
    
    // Get previous values (for trend analysis)
    const prevData = [
        treasury.values.length > 1 ? treasury.values[treasury.values.length - 2] : treasury.values[0],
        tedSpread.values.length > 1 ? tedSpread.values[tedSpread.values.length - 2] : tedSpread.values[0],
        cpi.values.length > 1 ? cpi.values[cpi.values.length - 2] : cpi.values[0],
        baml.values.length > 1 ? baml.values[baml.values.length - 2] : baml.values[0],
        mortgageSpread.values.length > 1 ? mortgageSpread.values[mortgageSpread.values.length - 2] : mortgageSpread.values[0],
        unemployment.values.length > 1 ? unemployment.values[unemployment.values.length - 2] : unemployment.values[0],
        housingStarts.values.length > 1 ? housingStarts.values[housingStarts.values.length - 2] : housingStarts.values[0],
        consumerSentiment.values.length > 1 ? consumerSentiment.values[consumerSentiment.values.length - 2] : consumerSentiment.values[0]
    ];
    
    // Predict
    const predictionProba = model.predict_proba([currentData])[0];
    const increaseProb = Math.round(predictionProba * 100);
    
    // Get feature importance for reasoning
    const featureImportance = model.getFeatureImportance();
    const featureWeights = model.getWeights();
    const features = [
        '10Y Treasury Yield', 
        'TED Spread', 
        'CPI Index', 
        'BBB Spread', 
        'Mortgage Market Spread', 
        'Unemployment Rate', 
        'Housing Starts', 
        'Consumer Sentiment'
    ];
    
    // Calculate trends
    const trends = currentData.map((curr, idx) => {
        const prev = prevData[idx];
        return {
            name: features[idx],
            current: curr,
            previous: prev,
            change: curr - prev,
            percentChange: prev !== 0 ? ((curr - prev) / prev) * 100 : 0,
            impact: featureWeights[idx] * (curr - prev),
            importance: featureImportance[idx]
        };
    });
    
    // Sort trends by absolute impact
    const sortedTrends = [...trends].sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
    
    // Update prediction percentage
    document.getElementById('prediction-percentage').textContent = `${increaseProb}%`;
    
    // Create the gauge visualization for prediction
    updateGauge(increaseProb);
    
    // Format reasoning based on trends
    let trendSummary = '';
    let factorBarsHtml = '';
    
    // Create trend summary
    trendSummary = `Based on current market conditions, there is a <strong>${increaseProb}%</strong> likelihood of NON-QM rates increasing in the near term. `;
    
    if (increaseProb > 75) {
        trendSummary += `<span class="prediction-high">The data strongly suggests rates will rise.</span>`;
    } else if (increaseProb > 50) {
        trendSummary += `<span class="prediction-medium-high">The data moderately suggests rates will rise.</span>`;
    } else if (increaseProb >= 25) {
        trendSummary += `<span class="prediction-medium-low">The data moderately suggests rates will fall.</span>`;
    } else {
        trendSummary += `<span class="prediction-low">The data strongly suggests rates will fall.</span>`;
    }
    
    // Update trend summary
    document.getElementById('trend-text').innerHTML = trendSummary;
    
    // Generate impact factor bars
    sortedTrends.forEach(trend => {
        const barWidth = Math.min(Math.abs(trend.impact) * 50, 100); // Scale for display
        const barColor = trend.impact > 0 ? '#ef4444' : '#22c55e'; // Red for increase, green for decrease
        const directionIcon = trend.impact > 0 ? '↑' : '↓';
        
        factorBarsHtml += `
            <div class="factor-row">
                <div class="factor-name">${trend.name}</div>
                <div class="factor-value">${trend.current.toFixed(2)} ${directionIcon} (${trend.change.toFixed(2)})</div>
                <div class="factor-bar-container">
                    <div class="factor-bar" style="width: ${barWidth}%; background-color: ${barColor};"></div>
                </div>
                <div class="factor-impact">${Math.abs(trend.impact).toFixed(2)}</div>
            </div>
        `;
    });
    
    // Update impact factors
    document.getElementById('factor-bars').innerHTML = factorBarsHtml;
    
    // Create detailed reasoning for the result panel
    let reasoning = `<p>Key factors influencing the prediction:</p><ul>`;
    
    // Add the top 3 most influential factors
    sortedTrends.slice(0, 3).forEach(trend => {
        const direction = trend.impact > 0 ? 'increases' : 'decreases';
        reasoning += `<li><strong>${trend.name}:</strong> Current value of ${trend.current.toFixed(2)} ${trend.change > 0 ? '↑' : '↓'} ${Math.abs(trend.change).toFixed(2)} ${direction} the likelihood of a rate increase (impact: ${Math.abs(trend.impact).toFixed(2)})</li>`;
    });
    
    reasoning += `</ul>`;
    
    // Add market context
    if (increaseProb > 75) {
        reasoning += `<p>Market context suggests significant upward pressure on NON-QM rates, primarily driven by rising treasury yields and widening credit spreads. Lenders are likely to increase their margins to account for higher funding costs and perceived market risks.</p>`;
    } else if (increaseProb > 50) {
        reasoning += `<p>Market conditions show moderate upward pressure on NON-QM rates. While some indicators suggest stability, the combined effect of key market signals points toward modest rate increases in the coming period.</p>`;
    } else if (increaseProb >= 25) {
        reasoning += `<p>Market trends indicate moderate downward pressure on NON-QM rates. Improving housing market conditions and economic sentiment are offsetting some of the factors that would typically drive rates higher.</p>`;
    } else {
        reasoning += `<p>Market signals strongly suggest downward pressure on NON-QM rates. Favorable conditions in both the broader economy and housing sector are conducive to rate decreases as lenders compete for qualified borrowers.</p>`;
    }
    
    // Update the result panel
    document.getElementById('result').innerHTML = reasoning;
    
    // Update all charts
    updateAllCharts(treasuryLabels, tedSpreadLabels, cpiLabels, bamlLabels, mortgageSpreadLabels, unemploymentLabels, housingStartsLabels, consumerSentimentLabels);
}
// Update all charts with new data
function updateAllCharts(treasuryLabels, tedSpreadLabels, cpiLabels, bamlLabels, mortgageSpreadLabels, unemploymentLabels, housingStartsLabels, consumerSentimentLabels) {
    const isDark = document.body.classList.contains('dark-mode');
    
    // Update chart data sets
    if (chartVisibility.treasury) {
        treasuryChart = initializeChart('treasury', {
            type: 'line',
            data: {
                labels: treasuryLabels,
                datasets: [{
                    label: '10Y Treasury Yield (%)',
                    data: treasury.values,
                    borderColor: isDark ? '#6cebce' : '#0891b2',
                    backgroundColor: isDark ? 'rgba(108, 235, 206, 0.2)' : 'rgba(8, 145, 178, 0.1)',
                    fill: true
                }]
            },
            options: getChartOptions(isDark, 'Yield (%)')
        });
    }
    
    if (chartVisibility.tedSpread) {
        tedSpreadChart = initializeChart('tedspread', {
            type: 'line',
            data: {
                labels: tedSpreadLabels,
                datasets: [{
                    label: 'TED Spread (%)',
                    data: tedSpread.values,
                    borderColor: isDark ? '#6cebce' : '#0891b2',
                    backgroundColor: isDark ? 'rgba(108, 235, 206, 0.2)' : 'rgba(8, 145, 178, 0.1)',
                    fill: true
                }]
            },
            options: getChartOptions(isDark, 'Spread (%)')
        });
    }
    
    if (chartVisibility.cpi) {
        cpiChart = initializeChart('cpi', {
            type: 'line',
            data: {
                labels: cpiLabels,
                datasets: [{
                    label: 'CPI Index',
                    data: cpi.values,
                    borderColor: isDark ? '#6cebce' : '#0891b2',
                    backgroundColor: isDark ? 'rgba(108, 235, 206, 0.2)' : 'rgba(8, 145, 178, 0.1)',
                    fill: true
                }]
            },
            options: getChartOptions(isDark, 'Index')
        });
    }
    
    if (chartVisibility.baml) {
        bamlChart = initializeChart('baml', {
            type: 'line',
            data: {
                labels: bamlLabels,
                datasets: [{
                    label: 'BBB Spread (%)',
                    data: baml.values,
                    borderColor: isDark ? '#6cebce' : '#0891b2',
                    backgroundColor: isDark ? 'rgba(108, 235, 206, 0.2)' : 'rgba(8, 145, 178, 0.1)',
                    fill: true
                }]
            },
            options: getChartOptions(isDark, 'Spread (%)')
        });
    }
    
    if (chartVisibility.mortgageSpread) {
        mortgageSpreadChart = initializeChart('mortgage-spread', {
            type: 'line',
            data: {
                labels: mortgageSpreadLabels,
                datasets: [{
                    label: 'Mortgage Market Spread (%)',
                    data: mortgageSpread.values,
                    borderColor: isDark ? '#6cebce' : '#0891b2',
                    backgroundColor: isDark ? 'rgba(108, 235, 206, 0.2)' : 'rgba(8, 145, 178, 0.1)',
                    fill: true
                }]
            },
            options: getChartOptions(isDark, 'Spread (%)')
        });
    }
    
    if (chartVisibility.unemployment) {
        unemploymentChart = initializeChart('unemployment', {
            type: 'line',
            data: {
                labels: unemploymentLabels,
                datasets: [{
                    label: 'Unemployment Rate (%)',
                    data: unemployment.values,
                    borderColor: isDark ? '#6cebce' : '#0891b2',
                    backgroundColor: isDark ? 'rgba(108, 235, 206, 0.2)' : 'rgba(8, 145, 178, 0.1)',
                    fill: true
                }]
            },
            options: getChartOptions(isDark, 'Rate (%)')
        });
    }
    
    if (chartVisibility.housingStarts) {
        housingStartsChart = initializeChart('housing-starts', {
            type: 'line',
            data: {
                labels: housingStartsLabels,
                datasets: [{
                    label: 'Housing Starts (Thousands)',
                    data: housingStarts.values,
                    borderColor: isDark ? '#6cebce' : '#0891b2',
                    backgroundColor: isDark ? 'rgba(108, 235, 206, 0.2)' : 'rgba(8, 145, 178, 0.1)',
                    fill: true
                }]
            },
            options: getChartOptions(isDark, 'Thousands')
        });
    }
    
    if (chartVisibility.consumerSentiment) {
        consumerSentimentChart = initializeChart('consumer-sentiment', {
            type: 'line',
            data: {
                labels: consumerSentimentLabels,
                datasets: [{
                    label: 'Consumer Sentiment Index',
                    data: consumerSentiment.values,
                    borderColor: isDark ? '#6cebce' : '#0891b2',
                    backgroundColor: isDark ? 'rgba(108, 235, 206, 0.2)' : 'rgba(8, 145, 178, 0.1)',
                    fill: true
                }]
            },
            options: getChartOptions(isDark, 'Index')
        });
    }
}

// Create a gauge chart for the prediction
function updateGauge(percentage) {
    const gaugeContainer = document.getElementById('gauge-container');
    const isDark = document.body.classList.contains('dark-mode');
    
    // Determine gauge color based on percentage
    let gaugeColor;
    if (percentage > 75) {
        gaugeColor = '#ef4444'; // Red for high likelihood of increase
    } else if (percentage > 50) {
        gaugeColor = '#f97316'; // Orange for moderate likelihood of increase
    } else if (percentage >= 25) {
        gaugeColor = '#eab308'; // Yellow for moderate likelihood of decrease
    } else {
        gaugeColor = '#22c55e'; // Green for high likelihood of decrease
    }
    
    // Create SVG gauge
    const angle = (percentage / 100) * 180;
    const gaugeHTML = `
        <svg width="150" height="75" viewBox="0 0 150 75">
            <!-- Background arc -->
            <path d="M10,65 A65,65 0 0,1 140,65" stroke="${isDark ? '#4b5563' : '#e5e7eb'}" stroke-width="10" fill="none" />
            
            <!-- Percentage arc -->
            <path d="M10,65 A65,65 0 0,1 ${10 + 130 * percentage / 100},${65 - Math.sin((percentage / 100) * Math.PI) * 65}" 
                  stroke="${gaugeColor}" stroke-width="10" fill="none" />
            
            <!-- Needle -->
            <line x1="75" y1="65" x2="${75 + 55 * Math.cos((percentage / 100 - 0.5) * Math.PI)}" 
                  y2="${65 - 55 * Math.sin((percentage / 100 - 0.5) * Math.PI)}" 
                  stroke="${isDark ? '#f3f4f6' : '#000'}" stroke-width="2" />
            
            <!-- Center circle -->
            <circle cx="75" cy="65" r="5" fill="${isDark ? '#f3f4f6' : '#000'}" />
            
            <!-- Labels -->
            <text x="10" y="85" fill="${isDark ? '#f3f4f6' : '#000'}" font-size="12">Decrease</text>
            <text x="112" y="85" fill="${isDark ? '#f3f4f6' : '#000'}" font-size="12">Increase</text>
        </svg>
    `;
    
    gaugeContainer.innerHTML = gaugeHTML;
}

// Generate a PDF report
function generateReport() {
    // PDF generation logic would go here
    // For real implementation, you would use a library like jsPDF
    alert('Report generation feature will be implemented in a future update.');
}
// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    // Load saved chart visibility settings or set defaults
    chartVisibility = JSON.parse(localStorage.getItem('chartVisibility')) || {
        treasury: true,
        tedSpread: true,
        cpi: true,
        baml: true,
        mortgageSpread: true,
        unemployment: true,
        housingStarts: true,
        consumerSentiment: true
    };
    
    // Apply visibility settings to checkboxes
    document.getElementById('toggle-treasury').checked = chartVisibility.treasury;
    document.getElementById('toggle-tedspread').checked = chartVisibility.tedSpread;
    document.getElementById('toggle-cpi').checked = chartVisibility.cpi;
    document.getElementById('toggle-baml').checked = chartVisibility.baml;
    document.getElementById('toggle-mortgage-spread').checked = chartVisibility.mortgageSpread;
    document.getElementById('toggle-unemployment').checked = chartVisibility.unemployment;
    document.getElementById('toggle-housing-starts').checked = chartVisibility.housingStarts;
    document.getElementById('toggle-consumer-sentiment').checked = chartVisibility.consumerSentiment;
    
    // Set initial visibility of chart containers
    document.getElementById('treasury-container').style.display = chartVisibility.treasury ? 'block' : 'none';
    document.getElementById('tedspread-container').style.display = chartVisibility.tedSpread ? 'block' : 'none';
    document.getElementById('cpi-container').style.display = chartVisibility.cpi ? 'block' : 'none';
    document.getElementById('baml-container').style.display = chartVisibility.baml ? 'block' : 'none';
    document.getElementById('mortgage-spread-container').style.display = chartVisibility.mortgageSpread ? 'block' : 'none';
    document.getElementById('unemployment-container').style.display = chartVisibility.unemployment ? 'block' : 'none';
    document.getElementById('housing-starts-container').style.display = chartVisibility.housingStarts ? 'block' : 'none';
    document.getElementById('consumer-sentiment-container').style.display = chartVisibility.consumerSentiment ? 'block' : 'none';
    
    // Add event listeners for chart visibility toggles
    document.getElementById('toggle-treasury').addEventListener('change', e => toggleChart('treasury', e.target.checked));
    document.getElementById('toggle-tedspread').addEventListener('change', e => toggleChart('tedspread', e.target.checked));
    document.getElementById('toggle-cpi').addEventListener('change', e => toggleChart('cpi', e.target.checked));
    document.getElementById('toggle-baml').addEventListener('change', e => toggleChart('baml', e.target.checked));
    document.getElementById('toggle-mortgage-spread').addEventListener('change', e => toggleChart('mortgage-spread', e.target.checked));
    document.getElementById('toggle-unemployment').addEventListener('change', e => toggleChart('unemployment', e.target.checked));
    document.getElementById('toggle-housing-starts').addEventListener('change', e => toggleChart('housing-starts', e.target.checked));
    document.getElementById('toggle-consumer-sentiment').addEventListener('change', e => toggleChart('consumer-sentiment', e.target.checked));
    
    // Add event listener for toggle all charts button
    document.getElementById('toggle-all-charts').addEventListener('click', () => {
        // Check if all are currently visible
        const allVisible = Object.values(chartVisibility).every(v => v === true);
        // Toggle all to opposite state
        const newState = !allVisible;
        
        // Update all checkboxes and charts
        ['treasury', 'tedspread', 'cpi', 'baml', 'mortgage-spread', 'unemployment', 'housing-starts', 'consumer-sentiment'].forEach(chartId => {
            document.getElementById(`toggle-${chartId}`).checked = newState;
            toggleChart(chartId, newState);
        });
    });
    
    // Add event listener for time frame selector
    document.getElementById('time-frame').addEventListener('change', e => {
        loadDashboard(e.target.value);
    });
    
    // Add event listener for refresh button
    document.getElementById('refresh-data').addEventListener('click', () => {
        // Clear cache to force refresh
        dataCache.timeFrame = null;
        loadDashboard(document.getElementById('time-frame').value);
    });
    
    // Add event listener for download report button
    document.getElementById('download-report').addEventListener('click', generateReport);
    
    // Load dashboard with default time frame
    loadDashboard('1month');
});

// Update chart colors when dark mode toggles
document.addEventListener('click', e => {
    if (e.target.id === 'dark-mode-toggle') {
        setTimeout(updateChartColors, 100);
    }
});

// Additional CSS for new UI elements (to be added to the page)
const additionalStyles = `
/* Dashboard Controls */
.dashboard-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    margin-bottom: 30px;
}

.time-frame-selector,
.chart-controls,
.action-buttons {
    flex: 1 0 250px;
    background: ${document.body.classList.contains('dark-mode') ? '#4b5563' : '#e6f7f3'};
    padding: 15px;
    border-radius: 10px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.chart-controls {
    display: flex;
    flex-direction: column;
}

.toggle-all-btn {
    margin-bottom: 10px;
    padding: 8px;
    background: ${document.body.classList.contains('dark-mode') ? '#6cebce' : '#000'};
    color: ${document.body.classList.contains('dark-mode') ? '#111827' : '#fff'};
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 0.9em;
}

.checkbox-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 8px;
}

.action-buttons {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 10px;
}

.refresh-btn,
.download-btn {
    padding: 10px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 1em;
    transition: background-color 0.3s;
}

.refresh-btn {
    background: ${document.body.classList.contains('dark-mode') ? '#6cebce' : '#000'};
    color: ${document.body.classList.contains('dark-mode') ? '#111827' : '#fff'};
}

.download-btn {
    background: ${document.body.classList.contains('dark-mode') ? '#818cf8' : '#4f46e5'};
    color: white;
}

/* Prediction Panel */
.prediction-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.prediction-gauge {
    display: flex;
    flex-direction: column;
    align-items: center;
}

#prediction-percentage {
    font-size: 1.8em;
    font-weight: bold;
    margin-top: 5px;
    color: ${document.body.classList.contains('dark-mode') ? '#f3f4f6' : '#000'};
}

.prediction-details {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    margin-bottom: 20px;
}

.trend-summary h4,
.impact-factors h4 {
    margin-top: 0;
    margin-bottom: 10px;
    color: ${document.body.classList.contains('dark-mode') ? '#f3f4f6' : '#000'};
}

.prediction-high {
    color: #ef4444;
    font-weight: bold;
}

.prediction-medium-high {
    color: #f97316;
    font-weight: bold;
}

.prediction-medium-low {
    color: #eab308;
    font-weight: bold;
}

.prediction-low {
    color: #22c55e;
    font-weight: bold;
}

.factor-row {
    display: grid;
    grid-template-columns: 30% 20% 40% 10%;
    align-items: center;
    padding: 6px 0;
    border-bottom: 1px solid ${document.body.classList.contains('dark-mode') ? '#4b5563' : '#e5e7eb'};
}

.factor-name {
    font-weight: 500;
}

.factor-value {
    text-align: right;
    padding-right: 10px;
}

.factor-bar-container {
    height: 10px;
    background: ${document.body.classList.contains('dark-mode') ? '#4b5563' : '#e5e7eb'};
    border-radius: 5px;
    overflow: hidden;
}

.factor-bar {
    height: 100%;
    border-radius: 5px;
}

.factor-impact {
    text-align: right;
    font-size: 0.9em;
    opacity: 0.8;
}

.prediction-text {
    padding: 15px;
    background: ${document.body.classList.contains('dark-mode') ? '#374151' : '#f8fafc'};
    border-radius: 8px;
    margin-bottom: 15px;
}

.last-updated {
    font-size: 0.8em;
    text-align: right;
    opacity: 0.7;
}

.loading-bars {
    height: 100px;
    background: linear-gradient(90deg, ${document.body.classList.contains('dark-mode') ? '#374151' : '#f8fafc'} 25%, ${document.body.classList.contains('dark-mode') ? '#4b5563' : '#e5e7eb'} 50%, ${document.body.classList.contains('dark-mode') ? '#374151' : '#f8fafc'} 75%);
    background-size: 200% 100%;
    border-radius: 5px;
    animation: loading 1.5s infinite;
}

@keyframes loading {
    0% {
        background-position: 200% 0;
    }
    100% {
        background-position: -200% 0;
    }
}

@media (max-width: 768px) {
    .dashboard-controls {
        flex-direction: column;
    }
    
    .prediction-header {
        flex-direction: column;
    }
    
    .factor-row {
        grid-template-columns: 1fr 1fr;
        grid-template-areas:
            "name value"
            "bar bar"
            "impact impact";
        gap: 5px;
    }
    
    .factor-name {
        grid-area: name;
    }
    
    .factor-value {
        grid-area: value;
    }
    
    .factor-bar-container {
        grid-area: bar;
    }
    
    .factor-impact {
        grid-area: impact;
        text-align: left;
    }
}
`;

// Add the additional styles to the document
function addAdditionalStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = additionalStyles;
    document.head.appendChild(styleElement);
}

// Call this when the DOM loads
document.addEventListener('DOMContentLoaded', () => {
    addAdditionalStyles();
    // Other initialization code is already included in the previous artifact
});
