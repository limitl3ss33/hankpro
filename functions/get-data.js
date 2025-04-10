const axios = require('axios');

exports.handler = async () => {
    try {
        const FRED_API_KEY = 'a4532a75077cb90723b177411251e551';
        const ALPHA_API_KEY = '6ABAUI46IPROWENZ';

        // Fetch 10Y Treasury Yield (DGS10) from FRED
        const treasuryResponse = await axios.get(
            `https://api.stlouisfed.org/fred/series/observations?series_id=DGS10&api_key=${FRED_API_KEY}&limit=5&file_type=json&sort_order=desc`
        );
        const treasury = {
            dates: treasuryResponse.data.observations.map(obs => obs.date),
            values: treasuryResponse.data.observations.map(obs => parseFloat(obs.value))
        };

        // Fetch VIX from Alpha Vantage
        const vixResponse = await axios.get(
            `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=VIX&apikey=${ALPHA_API_KEY}`
        );
        const vixSeries = vixResponse.data['Time Series (Daily)'];
        if (!vixSeries) {
            throw new Error('VIX data unavailable: API limit reached or invalid response');
        }
        const vix = {
            dates: Object.keys(vixSeries).slice(0, 5).reverse(),
            values: Object.values(vixSeries).slice(0, 5).map(d => parseFloat(d['4. close'])).reverse()
        };

        // Fetch CPI (CPIAUCSL) from FRED
        const cpiResponse = await axios.get(
            `https://api.stlouisfed.org/fred/series/observations?series_id=CPIAUCSL&api_key=${FRED_API_KEY}&limit=5&file_type=json&sort_order=desc`
        );
        const cpi = {
            dates: cpiResponse.data.observations.map(obs => obs.date),
            values: cpiResponse.data.observations.map(obs => parseFloat(obs.value))
        };

        // Fetch BAMLC0A4CBBB from FRED
        const bamlResponse = await axios.get(
            `https://api.stlouisfed.org/fred/series/observations?series_id=BAMLC0A4CBBB&api_key=${FRED_API_KEY}&limit=5&file_type=json&sort_order=desc`
        );
        const baml = {
            dates: bamlResponse.data.observations.map(obs => obs.date),
            values: bamlResponse.data.observations.map(obs => parseFloat(obs.value))
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
