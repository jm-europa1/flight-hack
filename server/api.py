from flask import Flask, request, jsonify
import pickle
from flasgger import Swagger

app = Flask(__name__)
swagger = Swagger(app)
model = pickle.load(open('model.pkl', 'rb'))

@app.route('/predict', methods=['GET'])
def predict():
    """
    Predict flight delay probability
    ---
    parameters:
      - name: day_of_week
        in: query
        type: integer
        required: true
        description: Day of the week (1=Monday, 7=Sunday)
      - name: airport_id
        in: query
        type: integer
        required: true
        description: Airport ID
    responses:
      200:
        description: Prediction result
        schema:
          type: object
          properties:
            delay_probability:
              type: number
              description: Probability the flight will be delayed
            confidence_percent:
              type: number
              description: Confidence percent of the prediction
    """
    day = int(request.args['day_of_week'])
    airport = int(request.args['airport_id'])
    proba = model.predict_proba([[day, airport]])[0][1]
    # For logistic regression, confidence can be the probability of the predicted class
    confidence = max(model.predict_proba([[day, airport]])[0]) * 100
    return jsonify({
        'delay_probability': proba,
        'confidence_percent': confidence
    })

@app.route('/data', methods=['GET'])
def get_data():
    """
    Get all data used to train the model
    ---
    responses:
      200:
        description: All training data
        schema:
          type: object
          properties:
            data:
              type: array
              items:
                type: object
    """
    import pandas as pd
    df = pd.read_csv('data/flights.csv')
    # Only return relevant columns for privacy/performance
    data = df[['DayOfWeek', 'DestAirportID', 'ArrDel15']].to_dict(orient='records')
    return jsonify({'data': data})

if __name__ == '__main__':
    app.run(port=5001)