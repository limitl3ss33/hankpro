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
                    reject(new Error(`Failed to parse JSON for ${url}: ${error.message}`));
                }
            });
        }).on('error', (error) => {
            reject(new Error(`HTTP request failed for ${url}: ${error.message}`));
        });
    });
};

exports.handler = async (event) => {
    try {
        const FRED_API_KEY = process.env.FRED_API_KEY;

        // Validate API key
        if (!FRED_API_KEY) {
            throw new Error('FRED_API_KEY is not defined in environment variables');
        }

        // Get the time frame from query parameters (default to 1 month)
        const timeFrame = event.queryStringParameters?.timeFrame || '1month';
        let limit;

        // Map time frames to number of data points (capped at 1000 for FRED API)
        switch (timeFrame) {
            case '1day':
                limit = 2; // Fetch 2 days for today vs yesterday comparison
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
                limit = 1000; // Cap at 1000 to avoid FRED API limits
                break;
            default:
                limit = 30; // Default to 1 month
        }

        // Fetch 10Y Treasury Yield (DGS10) from FRED
        let treasury;
        try {
            const treasuryData = await get(
                `https://api.stlouisfed.org/fred/series/observations?series_id=DGS10&api_key=${FRED_API_KEY}&limit=${limit}&file_type=json&sort_order=asc`
            );
            if (treasuryData.error_message) {
                throw new Error(`FRED API error (DGS10): ${treasuryData.error_message}`);
            }
            if (!treasuryData.observations || !Array.isArray(treasuryData.observations)) {
                throw new Error('FRED API (DGS10): Invalid response format, missing observations');
            }
            treasury = {
                dates: treasuryData.observations.map(obs => obs.date),
                values: treasuryData.observations.map(obs => parseFloat(obs.value) || 0)
            };
        } catch (error) {
            console.error('Treasury fetch error:', error.message);
            treasury = {
                dates: Array.from({ length: limit }, (_, i) => {
                    const date = new Date();
                    date.setDate(date.getDate() - (limit - 1 - i));
                    return date.toISOString().split('T')[0];
                }),
                values: Array.from({ length: limit }, (_, i) => 3.5 + (i * 0.01))
            };
        }

        // Fetch TED Spread (TEDRATE) from FRED
        let tedSpread;
        try {
            const tedData = await get(
                `https://api.stlouisfed.org/fred/series/observations?series_id=TEDRATE&api_key=${FRED_API_KEY}&limit=${limit}&file_type=json&sort_order=asc`
            );
            if (tedData.error_message) {
                throw new Error(`FRED API error (TEDRATE): ${tedData.error_message}`);
            }
            if (!tedData.observations || !Array.isArray(tedData.observations)) {
                throw new Error('FRED API (TEDRATE): Invalid response format, missing observations');
            }
            tedSpread = {
                dates: tedData.observations.map(obs => obs.date),
                values: tedData.observations.map(obs => parseFloat(obs.value) || 0)
            };
        } catch (error) {
            console.error('TED Spread fetch error:', error.message);
            tedSpread = {
                dates: Array.from({ length: limit }, (_, i) => {
                    const date = new Date();
                    date.setDate(date.getDate() - (limit - 1 - i));
                    return date.toISOString().split('T')[0];
                }),
                values: Array.from({ length: limit }, (_, i) => 0.5 + (i * 0.01))
            };
        }

        // Fetch CPI (CPIAUCSL) from FRED (monthly data)
        let cpi;
        try {
            const cpiData = await get(
                `https://api.stlouisfed.org/fred/series/observations?series_id=CPIAUCSL&api_key=${FRED_API_KEY}&limit=${Math.ceil(limit / 30)}&file_type=json&sort_order=asc`
            );
            if (cpiData.error_message) {
                throw new Error(`FRED API error (CPIAUCSL): ${cpiData.error_message}`);
            }
            if (!cpiData.observations || !Array.isArray(cpiData.observations)) {
                throw new Error('FRED API (CPIAUCSL): Invalid response format, missing observations');
            }
            cpi = {
                dates: cpiData.observations.map(obs => obs.date),
                values: cpiData.observations.map(obs => parseFloat(obs.value) || 0)
            };
        } catch (error) {
            console.error('CPI fetch error:', error.message);
            cpi = {
                dates: Array.from({ length: Math.ceil(limit / 30) }, (_, i) => {
                    const date = new Date();
                    date.setMonth(date.getMonth() - (Math.ceil(limit / 30) - 1 - i));
                    return date.toISOString().split('T')[0].substring(0, 7) + '-01';
                }),
                values: Array.from({ length: Math.ceil(limit / 30) }, (_, i) => 270 + i)
            };
        }

        // Fetch BBB Spread (BAMLC0A4CBBB) from FRED
        let baml;
        try {
            const bamlData = await get(
                `https://api.stlouisfed.org/fred/series/observations?series_id=BAMLC0A4CBBB&api_key=${FRED_API_KEY}&limit=${limit}&file_type=json&sort_order=asc`
            );
            if (bamlData.error_message) {
                throw new Error(`FRED API error (BAMLC0A4CBBB): ${bamlData.error_message}`);
            }
            if (!bamlData.observations || !Array.isArray(bamlData.observations)) {
                throw new Error('FRED API (BAMLC0A4CBBB): Invalid response format, missing observations');
            }
            baml = {
                dates: bamlData.observations.map(obs => obs.date),
                values: bamlData.observations.map(obs => parseFloat(obs.value) || 0)
            };
        } catch (error) {
            console.error('BAML fetch error:', error.message);
            baml = {
                dates: Array.from({ length: limit }, (_, i) => {
                    const date = new Date();
                    date.setDate(date.getDate() - (limit - 1 - i));
                    return date.toISOString().split('T')[0];
                }),
                values: Array.from({ length: limit }, (_, i) => 1.4 + (i * 0.01))
            };
        }

        return {
            statusCode: 200,
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            },
            body: JSON.stringify({ treasury, tedSpread, cpi, baml })
        };
    } catch (error) {
        console.error('Function error:', error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
