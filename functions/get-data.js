const https = require('https');

// Helper function to make HTTP GET requests using https
const get = (url) => {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (error) {
                    reject(new Error('Failed to parse JSON: ' + error.message));
                }
            });
        }).on('error', (error) => {
            reject(error);
        });
    });
};

exports.handler = async () => {
    try {
        const FRED_API_KEY = 'a4532a75077cb90723b177411251e551';
        const ALPHA_API_KEY = '6ABAUI46IPROWENZ';

        // Fetch 10Y Treasury Yield (DGS10) from FRED
        const treasuryData = await get(
            `https://api.stlouisfed.org/fred/series/observations?series_id=DGS10&api_key=${FRED_API_KEY}&limit=5&file_type=json&sort_order=desc`
        );
        const treasury = {
            dates: treasuryData.observations.map(obs => obs.date),
            values: treasuryData.observations.map(obs => parseFloat(obs.value))
        };

        // Fetch VIX from Alpha Vantage
        const vixData = await get(
            `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=VIX&apikey=${ALPHA_API_KEY}`
        );
        const vixSeries = vixData['Time Series (Daily)'];
        if (!vixSeries) {
            throw new Error('VIX data unavailable: API limit reached or invalid response');
        }
        const vix = {
            dates: Object.keys(vixSeries).slice(0, 5).reverse(),
            values: Object.values(vixSeries).slice(0, 5).map(d => parseFloat(d['4. close'])).reverse()
        };

        // Fetch CPI (CPIAUCSL) from FRED
        const cpiData = await get(
            `https://api.stlouisfed.org/fred/series/observations?series_id=CPIAUCSL&api_key=${FRED_API_KEY}&limit=5&file_type=json&sort_order=desc`
        );
        const cpi = {
            dates: cpiData.observations.map(obs => obs.date),
            values: cpiData.observations.map(obs => parseFloat(obs.value))
        };

        // Fetch BAMLC0A4CBBB from FRED
        const bamlData = await get(
            `https://api.stlouisfed.org/fred/series/observations?series_id=BAMLC0A4CBBB&api_key=${FRED_API_KEY}&limit=5&file_type=json&sort_order=desc`
        );
        const baml = {
            dates: bamlData.observations.map(obs => obs.date),
            values: bamlData.observations.map(obs => parseFloat(obs.value))
        };

        return {
            statusCode: 200,
            body: JSON.stringify({ treasury, vix, cpi, baml })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
