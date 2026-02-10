from flask import Flask, render_template, request, jsonify
import folium
from folium.plugins import HeatMap

# This line tells Flask to look in the same folder for HTML files
app = Flask(__name__, template_folder='.')

complaints = [[22.5726, 88.3639, 1]]

@app.route('/')
def home():
    # Now it looks for index.html in the same folder as app.py
    return render_template('index.html')

@app.route('/login')
def login():
    return render_template('login.html')

@app.route('/report_complaint', methods=['POST'])
def report():
    data = request.json
    complaints.append([data['lat'], data['lng'], 2])
    return jsonify({"status": "success"})

@app.route('/get_map')
def get_map():
 
    m = folium.Map(location=[22.5726, 88.3639], zoom_start=13)
    

    HeatMap(complaints, radius=20).add_to(m)
    
 
    return m._repr_html_()
if __name__ == '__main__':
    app.run(debug=True)