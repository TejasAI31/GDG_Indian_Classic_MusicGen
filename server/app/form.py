from flask import Flask, request, jsonify, render_template
from werkzeug.utils import secure_filename
from flask_cors import CORS
import os
import logging
from flask_pymongo import PyMongo

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)
app = Flask(__name__)

# Connect to Musicgen database
app.config['MONGO_URI'] = "mongodb://localhost:27017/Musicgen"
mongo = PyMongo(app)

# Define absolute paths for better reliability
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)  # Ensure base uploads folder exists

# Configure CORS
cors_config = {
    "origins": ["http://localhost:3000"],
    "methods": ["GET", "POST", "OPTIONS"],
    "allow_headers": [
        "Content-Type",
        "Authorization",
        "Accept",
        "Origin",
        "User-Agent"
    ],
    "supports_credentials": True,
    "max_age": 3600
}

# Initialize CORS with debug logging
CORS(app, **cors_config)
logger.debug("CORS initialized with config:", cors_config)

@app.after_request
def after_request(response):
    logger.debug(f"After request: {response}")
    return response

@app.errorhandler(Exception)
def handle_exception(error):
    logger.error(f"Error: {str(error)}")
    return jsonify({"error": str(error)}), 500

@app.route('/')
def index():
    try:
        logger.info("Rendering test.html template")
        return render_template('test.html')
    except Exception as e:
        logger.error(f"Failed to render template: {str(e)}")
        return jsonify({
            'error': 'Template rendering failed',
            'details': str(e)
        }), 500

@app.route('/upload', methods=['GET', 'POST'])
def upload_file():
    try:
        logger.info("New upload request received")
        if request.method != 'POST':
            return jsonify({"message": "Method not allowed"}), 405
        if 'file' not in request.files:
            logger.warning("No file part in request")
            return jsonify({'error': 'No file part'}), 400
        file = request.files['file']
        if file.filename == '':
            logger.warning("Empty filename provided")
            return jsonify({'error': 'No selected file'}), 400
        if file:
            filename = secure_filename(file.filename)
            logger.info(f"Processing file: {filename}")
            # Use absolute path for reliability
            upload_path = os.path.join(UPLOAD_FOLDER, filename)
            logger.debug(f"Saving file to: {upload_path}")
            # Create parent directories if needed
            os.makedirs(os.path.dirname(upload_path), exist_ok=True)
            file.save(upload_path)
            logger.info(f"File saved successfully: {upload_path}")
            return jsonify({
                'message': f'File {filename} uploaded successfully',
                'filename': filename,
                'filepath': upload_path
            }), 200
    except Exception as e:
        logger.error(f"Upload failed: {str(e)}")
        return jsonify({
            'error': 'Upload failed',
            'details': str(e)
        }), 500

# New testing route for JSON data
@app.route('/test-json', methods=['POST'])
def test_json():
    try:
        logger.info("New JSON test request received")
        data = request.get_json()
        
        if not data:
            logger.warning("No JSON data provided")
            return jsonify({'error': 'No JSON data provided'}), 400
        
        # Insert data into music collection
        result = mongo.db.music.insert_one(data)
        
        logger.info(f"JSON data inserted successfully: {result.inserted_id}")
        return jsonify({
            'message': 'JSON data inserted successfully',
            'inserted_id': str(result.inserted_id),
            'data': data
        }), 200
        
    except Exception as e:
        logger.error(f"JSON test failed: {str(e)}")
        return jsonify({
            'error': 'JSON test failed',
            'details': str(e)
        }), 500

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)