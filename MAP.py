from flask import Flask, render_template, request, jsonify, send_from_directory
import folium
from folium.plugins import HeatMap
import firebase_admin
from firebase_admin import credentials, firestore

 
if not firebase_admin._apps:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)

db = firestore.client()
app = Flask(__name__, template_folder='.')

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/login')
def login():
    return render_template('login.html')

@app.route('/report_complaint', methods=['POST'])
def report():
    data = request.json
    # Storing real data in Firestore
    db.collection('complaints').add({
        'lat': data['lat'],
        'lng': data['lng'],
        'timestamp': firestore.SERVER_TIMESTAMP
    })
    return jsonify({"status": "success"})

@app.route('/get_map')
def get_map():
    # 2. Fetch ALL real complaints from Firebase
    docs = db.collection('complaints').stream()
    real_data = [[d.to_dict()['lat'], d.to_dict()['lng'], 1] for d in docs]

    # 3. DYNAMIC CENTERING: Use coordinates sent from the user's browser
    # We remove the hardcoded Campus coordinates here.
    user_lat = request.args.get('lat', type=float)
    user_lng = request.args.get('lng', type=float)

    # If the user hasn't shared location yet, we show a default view
    if user_lat is None or user_lng is None:
        # Default view (Kolkata region) until user allows GPS
        m = folium.Map(location=[22.5726, 88.3639], zoom_start=12)
    else:
        # Map centers EXACTLY on the user
        m = folium.Map(location=[user_lat, user_lng], zoom_start=16)
        # Add a Blue Marker to show where the user is currently on campus
        folium.Marker(
            [user_lat, user_lng], 
            popup="You are here", 
            icon=folium.Icon(color='blue', icon='user', prefix='fa')
        ).add_to(m)

    # Add the global heatmap of all campus issues
    HeatMap(real_data, radius=25, blur=15).add_to(m)
    
    return m._repr_html_()

@app.route('/map.js')
def serve_js():
    return send_from_directory('.', 'map.js')

if __name__ == '__main__':
    app.run(debug=True)