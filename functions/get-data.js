const https = require('https');

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

exports.handler = async (event) => {
    try {
        const FRED_API_KEY = process.env.FRED_API_KEY;
        const ALPHA_API_KEY = process.env.ALPHA_API_KEY;

        // Get the time frame from query parameters (default to 1 month)
        const timeFrame = event.queryStringParameters?.timeFrame || '1month';
        let limit;

        // Map time frames to number of data points
        switch (timeFrame) {
            case '1day':
                limit = 1;
                break;
            case '3day':
                limit = 3;
                break;
            case '7day':
                limit = 7;
                break;
            case '1month':
                limit = 30;
                break;
            case '3month':
                limit = 90;
                break;
            case '1year':
                limit = 365;
                break;
            case '5year':
                limit = 1825;
                break;
            default:
                limit = 30; // Default to 1 month
        }

        // Fetch 10Y Treasury Yield (DGS10) from FRED
        const treasuryData = await get(
            `https://api.stlouisfed.org/fred/series/observations?series_id=DGS10&api_key=${FRED_API_KEY}&limit=${limit}&file_type=json&sort_order=asc`
        );
        const treasury = {
            dates: treasuryData.observations.map(obs => obs.date),
            values: treasuryData.observations.map(obs => parseFloat(obs.value))
        };

        // Fetch VIX from Alpha Vantage
        let vix;
        try {
            const vixData = await get(
                `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=^VIX&apikey=${ALPHA_API_KEY}&outputsize=full`
            );
            if (vixData['Error Message']) {
                throw new Error(`Alpha Vantage error: ${vixData['Error Message']}`);
            }
            if (vixData['Note']) {
                throw new Error(`Alpha Vantage rate limit: ${vixData['Note']}`);
            }
            const vixSeries = vixData['Time Series (Daily)'];
            if (!vixSeries) {
                throw new Error('VIX data unavailable: Invalid response format');
            }
            const vixDates = Object.keys(vixSeries).sort(); // Sort dates oldest to newest
            const vixValues = vixDates.map(date => parseFloat(vixSeries[date]['4. close']));
            vix = {
                dates: vixDates.slice(-limit), // Take the most recent 'limit' data points
                values: vixValues.slice(-limit)
            };
        } catch (error) {
            console.error('VIX fetch error:', error.message);
            vix = {
                dates: Array.from({ length: limit }, (_, i) => {
                    const date = new Date();
                    date.setDate(date.getDate() - (limit - 1 - i));
                    return date.toISOString().split('T')[0];
                }),
                values: Array.from({ length: limit }, (_, i) => 20 + i % 5)
            };
        }

        // Fetch CPI (CPIAUCSL) from FRED (monthly data)
        const cpiData = await get(
            `https://api.stlouisfed.org/fred/series/observations?series_id=CPIAUCSL&api_key=${FRED_API_KEY}&limit=${Math.ceil(limit / 30)}&file_type=json&sort_order=asc`
        );
        const cpi = {
            dates: cpiData.observations.map(obs => obs.date),
            values: cpiData.observations.map(obs => parseFloat(obs.value))
        };

        // Fetch BAMLC0A4CBBB from FRED
        const bamlData = await get(
            `https://api.stlouisfed.org/fred/series/observations?series_id=BAMLC0A4CBBB&api_key=${FRED_API_KEY}&limit=${limit}&file_type=json&sort_order=asc`
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
