from flask import Flask, render_template, request, jsonify, send_from_directory
import folium
from folium.plugins import HeatMap
import firebase_admin
from firebase_admin import credentials, firestore

 
if not firebase_admin._apps:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)

db = firestore.client()
app = Flask(__name__,
             template_folder='.')

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
    try:
        docs = db.collection('complaints').stream()
        real_data = []
        for d in docs:
            item = d.to_dict()
            if 'lat' in item and 'lng' in item:
                real_data.append([float(item['lat']), float(item['lng']), 1])

        # Get coordinates from JS
        user_lat = request.args.get('lat', type=float)
        user_lng = request.args.get('lng', type=float)

        # Center map
        center = [user_lat, user_lng] if user_lat else [22.5726, 88.3639]
        m = folium.Map(location=center, zoom_start=15)

        # ONLY add HeatMap if real_data has points
        if len(real_data) > 0:
            HeatMap(real_data, radius=25, blur=15).add_to(m)
        else:
            # Add a single fake point so the map doesn't look broken during testing
            print("No data in Firebase yet. Showing empty map.")
        
            
        return render_template('map.html')
    except Exception as e:
        return f"Database not ready: {str(e)}", 500
@app.route('/map.js')
def serve_js():
    return send_from_directory('.', 'map.js')
@app.route('/student')
def student():
    return render_template('student.html')
if __name__ == '__main__':
    app.run(debug=True)