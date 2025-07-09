const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');

const app = express();
const PORT = 5000;

app.use(cors());

// Load airports data from CSV
function loadAirports() {
    const csvPath = path.join(__dirname, '../data/airports.csv');
    const data = fs.readFileSync(csvPath, 'utf8');
    const lines = data.trim().split('\n');
    const [header, ...rows] = lines;
    return rows
        .map(line => {
            const [id, name] = line.split(',');
            return { id: Number(id), name: name.trim() };
        })
        .sort((a, b) => a.name.localeCompare(b.name));
}

// Load and cache flights data
let flightsData = null;
function loadFlightsData() {
    if (!flightsData) {
        const csvPath = path.join(__dirname, '../data/flights.csv');
        const data = fs.readFileSync(csvPath, 'utf8');
        const lines = data.trim().split('\n');
        const [header, ...rows] = lines;
        const columns = header.split(',');
        flightsData = rows.map(line => {
            const values = line.split(',');
            const obj = {};
            columns.forEach((col, idx) => {
                obj[col.trim()] = values[idx].trim();
            });
            return obj;
        });
    }
    return flightsData;
}

// Model prediction function based on flights.csv data
function predictDelay(dayOfWeek, airportId) {
    const data = loadFlightsData();
    // Adjust these keys if your CSV uses different column names
    const dayKey = 'DAY_OF_WEEK';
    const airportKey = 'ORIGIN_AIRPORT_ID';
    const delayKey = 'ARRIVAL_DELAY';

    // Filter for matching flights
    const filtered = data.filter(row =>
        Number(row[dayKey]) === dayOfWeek && Number(row[airportKey]) === airportId
    );
    if (filtered.length === 0) {
        return { delay: null, certainty: 0 };
    }
    // Count delayed flights (arrival delay > 15 min)
    const delayed = filtered.filter(row => Number(row[delayKey]) > 15);
    const delayProb = delayed.length / filtered.length;
    return {
        delay: delayProb, // probability of delay
        certainty: filtered.length / data.length // confidence as percent of all data
    };
}

// Endpoint: Get list of airports
app.get('/airports', (req, res) => {
    try {
        const airports = loadAirports();
        res.json(airports);
    } catch (err) {
        res.status(500).json({ error: 'Failed to load airports data.' });
    }
});

// Endpoint: Predict flight delay
app.get('/predict', (req, res) => {
    const dayOfWeek = Number(req.query.day_of_week);
    const airportId = Number(req.query.airport_id);

    if (!dayOfWeek || !airportId) {
        return res.status(400).json({ error: 'Missing day_of_week or airport_id parameter.' });
    }

    // Call the model (replace with actual model integration)
    const result = predictDelay(dayOfWeek, airportId);

    res.json(result);
});

// Swagger UI setup
const swaggerDocument = {
    openapi: '3.0.0',
    info: {
        title: 'Flight Delay Prediction API',
        version: '1.0.0',
        description: 'API for predicting flight delays and listing airports.'
    },
    servers: [
        { url: `https://upgraded-space-trout-q7x96jw9q5jg245q5-5000.app.github.dev/` }
    ],
    paths: {
        '/airports': {
            get: {
                summary: 'Get list of airports',
                responses: {
                    200: {
                        description: 'List of airports',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            id: { type: 'integer' },
                                            name: { type: 'string' }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        '/predict': {
            get: {
                summary: 'Predict flight delay',
                parameters: [
                    {
                        name: 'day_of_week',
                        in: 'query',
                        required: true,
                        schema: { type: 'integer' },
                        description: 'Day of the week (1=Monday, 7=Sunday)'
                    },
                    {
                        name: 'airport_id',
                        in: 'query',
                        required: true,
                        schema: { type: 'integer' },
                        description: 'Airport ID'
                    }
                ],
                responses: {
                    200: {
                        description: 'Prediction result',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        delay: { type: 'number', nullable: true },
                                        certainty: { type: 'number' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});