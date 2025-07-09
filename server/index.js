const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');

const app = express();
const PORT = 5000;

app.use(cors());

const axios = require('axios');

app.get('/predict', async (req, res) => {
    const { day_of_week, airport_id } = req.query;
    try {
        const response = await axios.get('http://localhost:5001/predict', {
            params: { day_of_week, airport_id }
        });
        res.json(response.data);
    } catch (err) {
        res.status(500).json({ error: 'Prediction service unavailable.' });
    }
});

// Endpoint: Get list of airports
app.get('/airports', async (req, res) => {
    try {
        const response = await axios.get('http://localhost:5001/data');
        res.json(response.data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to load airports data.' });
    }
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