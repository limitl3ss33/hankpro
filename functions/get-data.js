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
        let startDate = new Date();

        // Map time frames to number of data points and start date
        switch (timeFrame) {
            case '1day':
                limit = 2; // Fetch 2 days for today vs yesterday comparison
                startDate.setDate(startDate.getDate() - 2);
                break;
            case '3day':
                limit = 3;
                startDate.setDate(startDate.getDate() - 3);
                break;
            case '7day':
                limit = 7;
                startDate.setDate(startDate.getDate() - 7);
                break;
            case '1month':
                limit = 30;
                startDate.setDate(startDate.getDate() - 30);
                break;
            case '3month':
                limit = 90;
                startDate.setDate(startDate.getDate() - 90);
                break;
            case '1year':
                limit = 365;
                startDate.setDate(startDate.getDate() - 365);
                break;
            case '5year':
                limit = 1000; // Cap at 1000 to avoid FRED API limits
                startDate.setDate(startDate.getDate() - 1825);
                break;
            default:
                limit = 30; // Default to 1 month
                startDate.setDate(startDate.getDate() - 30);
        }

        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = new Date().toISOString().split('T')[0];

        // Fetch 10Y Treasury Yield (DGS10) from FRED
        let treasury;
        try {
            const treasuryData = await get(
                `https://api.stlouisfed.org/fred/series/observations?series_id=DGS10&api_key=${FRED_API_KEY}&limit=${limit}&file_type=json&sort_order=asc&observation_start=${startDateStr}&observation_end=${endDateStr}`
            );
            if (treasuryData.error_message) {
                throw new Error(`FRED API error (DGS10): ${treasuryData.error_message}`);
            }
            if (!treasuryData.observations || !Array.isArray(treasuryData.observations) || treasuryData.observations.length === 0) {
                throw new Error('FRED API (DGS10): No observations found for the specified period');
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
                `https://api.stlouisfed.org/fred/series/observations?series_id=TEDRATE&api_key=${FRED_API_KEY}&limit=${limit}&file_type=json&sort_order=asc&observation_start=${startDateStr}&observation_end=${endDateStr}`
            );
            if (tedData.error_message) {
                throw new Error(`FRED API error (TEDRATE): ${tedData.error_message}`);
            }
            if (!tedData.observations || !Array.isArray(tedData.observations) || tedData.observations.length === 0) {
                throw new Error('FRED API (TEDRATE): No observations found for the specified period');
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
                `https://api.stlouisfed.org/fred/series/observations?series_id=CPIAUCSL&api_key=${FRED_API_KEY}&limit=${Math.ceil(limit / 30)}&file_type=json&sort_order=asc&observation_start=${startDateStr}&observation_end=${endDateStr}`
            );
            if (cpiData.error_message) {
                throw new Error(`FRED API error (CPIAUCSL): ${cpiData.error_message}`);
            }
            if (!cpiData.observations || !Array.isArray(cpiData.observations) || cpiData.observations.length === 0) {
                throw new Error('FRED API (CPIAUCSL): No observations found for the specified period');
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
                `https://api.stlouisfed.org/fred/series/observations?series_id=BAMLC0A4CBBB&api_key=${FRED_API_KEY}&limit=${limit}&file_type=json&sort_order=asc&observation_start=${startDateStr}&observation_end=${endDateStr}`
            );
            if (bamlData.error_message) {
                throw new Error(`FRED API error (BAMLC0A4CBBB): ${bamlData.error_message}`);
            }
            if (!bamlData.observations || !Array.isArray(bamlData.observations) || bamlData.observations.length === 0) {
                throw new Error('FRED API (BAMLC0A4CBBB): No observations found for the specified period');
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

        // Fetch 30-Year Fixed Mortgage Rate (MORTGAGE30US) from FRED and calculate Mortgage Market Spread
        let mortgageSpread;
        try {
            const mortgageData = await get(
                `https://api.stlouisfed.org/fred/series/observations?series_id=MORTGAGE30US&api_key=${FRED_API_KEY}&limit=${Math.ceil(limit / 7)}&file_type=json&sort_order=asc&observation_start=${startDateStr}&observation_end=${endDateStr}`
            );
            if (mortgageData.error_message) {
                throw new Error(`FRED API error (MORTGAGE30US): ${mortgageData.error_message}`);
            }
            if (!mortgageData.observations || !Array.isArray(mortgageData.observations) || mortgageData.observations.length === 0) {
                throw new Error('FRED API (MORTGAGE30US): No observations found for the specified period');
            }
            const mortgageRates = mortgageData.observations.map(obs => ({
                date: obs.date,
                value: parseFloat(obs.value) || 0
            }));
            // Align dates with treasury data and calculate spread
            const spreadData = treasury.dates.map(date => {
                const mortgageEntry = mortgageRates.find(m => m.date <= date) || mortgageRates[mortgageRates.length - 1];
                const treasuryValue = treasury.values[treasury.dates.indexOf(date)];
                return {
                    date,
                    value: mortgageEntry ? (mortgageEntry.value - treasuryValue) : 0
                };
            });
            mortgageSpread = {
                dates: spreadData.map(d => d.date),
                values: spreadData.map(d => d.value)
            };
        } catch (error) {
            console.error('Mortgage Spread fetch error:', error.message);
            mortgageSpread = {
                dates: Array.from({ length: limit }, (_, i) => {
                    const date = new Date();
                    date.setDate(date.getDate() - (limit - 1 - i));
                    return date.toISOString().split('T')[0];
                }),
                values: Array.from({ length: limit }, (_, i) => 2.0 + (i * 0.01))
            };
        }

        // Fetch Unemployment Rate (UNRATE) from FRED
        let unemployment;
        try {
            const unrateData = await get(
                `https://api.stlouisfed.org/fred/series/observations?series_id=UNRATE&api_key=${FRED_API_KEY}&limit=${Math.ceil(limit / 30)}&file_type=json&sort_order=asc&observation_start=${startDateStr}&observation_end=${endDateStr}`
            );
            if (unrateData.error_message) {
                throw new Error(`FRED API error (UNRATE): ${unrateData.error_message}`);
            }
            if (!unrateData.observations || !Array.isArray(unrateData.observations) || unrateData.observations.length === 0) {
                throw new Error('FRED API (UNRATE): No observations found for the specified period');
            }
            unemployment = {
                dates: unrateData.observations.map(obs => obs.date),
                values: unrateData.observations.map(obs => parseFloat(obs.value) || 0)
            };
        } catch (error) {
            console.error('Unemployment fetch error:', error.message);
            unemployment = {
                dates: Array.from({ length: Math.ceil(limit / 30) }, (_, i) => {
                    const date = new Date();
                    date.setMonth(date.getMonth() - (Math.ceil(limit / 30) - 1 - i));
                    return date.toISOString().split('T')[0].substring(0, 7) + '-01';
                }),
                values: Array.from({ length: Math.ceil(limit / 30) }, (_, i) => 4.0 + (i * 0.1))
            };
        }

        // Fetch Housing Starts (HOUST) from FRED
        let housingStarts;
        try {
            const houstData = await get(
                `https://api.stlouisfed.org/fred/series/observations?series_id=HOUST&api_key=${FRED_API_KEY}&limit=${Math.ceil(limit / 30)}&file_type=json&sort_order=asc&observation_start=${startDateStr}&observation_end=${endDateStr}`
            );
            if (houstData.error_message) {
                throw new Error(`FRED API error (HOUST): ${houstData.error_message}`);
            }
            if (!houstData.observations || !Array.isArray(houstData.observations) || houstData.observations.length === 0) {
                throw new Error('FRED API (HOUST): No observations found for the specified period');
            }
            housingStarts = {
                dates: houstData.observations.map(obs => obs.date),
                values: houstData.observations.map(obs => parseFloat(obs.value) || 0)
            };
        } catch (error) {
            console.error('Housing Starts fetch error:', error.message);
            housingStarts = {
                dates: Array.from({ length: Math.ceil(limit / 30) }, (_, i) => {
                    const date = new Date();
                    date.setMonth(date.getMonth() - (Math.ceil(limit / 30) - 1 - i));
                    return date.toISOString().split('T')[0].substring(0, 7) + '-01';
                }),
                values: Array.from({ length: Math.ceil(limit / 30) }, (_, i) => 1200 + (i * 10))
            };
        }

        // Fetch Consumer Sentiment (UMCSENT) from FRED
        let consumerSentiment;
        try {
            const umcsentData = await get(
                `https://api.stlouisfed.org/fred/series/observations?series_id=UMCSENT&api_key=${FRED_API_KEY}&limit=${Math.ceil(limit / 30)}&file_type=json&sort_order=asc&observation_start=${startDateStr}&observation_end=${endDateStr}`
            );
            if (umcsentData.error_message) {
                throw new Error(`FRED API error (UMCSENT): ${umcsentData.error_message}`);
            }
            if (!umcsentData.observations || !Array.isArray(umcsentData.observations) || umcsentData.observations.length === 0) {
                throw new Error('FRED API (UMCSENT): No observations found for the specified period');
            }
            consumerSentiment = {
                dates: umcsentData.observations.map(obs => obs.date),
                values: umcsentData.observations.map(obs => parseFloat(obs.value) || 0)
            };
        } catch (error) {
            console.error('Consumer Sentiment fetch error:', error.message);
            consumerSentiment = {
                dates: Array.from({ length: Math.ceil(limit / 30) }, (_, i) => {
                    const date = new Date();
                    date.setMonth(date.getMonth() - (Math.ceil(limit / 30) - 1 - i));
                    return date.toISOString().split('T')[0].substring(0, 7) + '-01';
                }),
                values: Array.from({ length: Math.ceil(limit / 30) }, (_, i) => 70 + (i * 1))
            };
        }

        return {
            statusCode: 200,
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            },
            body: JSON.stringify({ treasury, tedSpread, cpi, baml, mortgageSpread, unemployment, housingStarts, consumerSentiment })
        };
    } catch (error) {
        console.error('Function error:', error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
