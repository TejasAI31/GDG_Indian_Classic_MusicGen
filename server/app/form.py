from bson import ObjectId
from flask import Flask, request, jsonify, render_template, send_file, send_from_directory
from werkzeug.utils import secure_filename
from flask_cors import CORS
import os
import logging
from flask_pymongo import PyMongo
import gridfs
import io
from datetime import datetime
import threading
import time
import json

from DataExtractor import DataExtractor  # Assuming DataExtractor is in the same directory


# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
app = Flask(__name__)

# Connect to Musicgen database
app.config['MONGO_URI'] = "mongodb://localhost:27017/Musicgen"
mongo = PyMongo(app)

# Set up GridFS
fs = gridfs.GridFS(mongo.db)

# Define absolute paths for better reliability
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)  # Ensure base uploads folder exists
OUTPUT_FOLDER = os.path.join(BASE_DIR, 'outputs')
os.makedirs(OUTPUT_FOLDER, exist_ok=True)  # Ensure outputs folder exists

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

# Store processing results
processing_results = {}

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

ALLOWED_EXTENSIONS = {'mp3'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Callback function for async processing
def processing_complete_callback(user_id, result):
    processing_results[user_id] = result
    # Store result in MongoDB for persistence
    mongo.db.processing_results.update_one(
        {'user_id': user_id},
        {'$set': {'result': result, 'completed_at': datetime.utcnow()}},
        upsert=True
    )
    logger.info(f"Processing completed for user {user_id}")
@app.route('/process-audio/<user_id>', methods=['POST'])
def process_audio(user_id):
    try:
        logger.info(f"Processing audio for user: {user_id}")
        
        # Get the latest uploaded file for this user from MongoDB
        user = mongo.db.users.find_one({'id': user_id})
        if not user:
            logger.error(f"User {user_id} not found")
            return jsonify({'error': 'User not found'}), 404
            
        audio_files = user.get('audio_files', [])
        if not audio_files:
            logger.error(f"No audio files found for user {user_id}")
            return jsonify({'error': 'No audio files found for user'}), 404
            
        # Get the latest file (sort by uploaded_at timestamp)
        latest_file = sorted(audio_files, key=lambda x: x['uploaded_at'], reverse=True)[0]
        file_path = latest_file['file_path']
        filename = latest_file['filename']
        
        if not os.path.exists(file_path):
            logger.error(f"File {file_path} not found on disk")
            
            # Try to get it from GridFS
            try:
                gridfs_id = latest_file['gridfs_id']
                grid_out = fs.get(gridfs_id)
                
                # Create user directory if it doesn't exist
                user_folder = os.path.join(UPLOAD_FOLDER, user_id)
                os.makedirs(user_folder, exist_ok=True)
                
                # Save to disk
                file_path = os.path.join(user_folder, filename)
                with open(file_path, 'wb') as f:
                    f.write(grid_out.read())
                logger.info(f"Restored file from GridFS to {file_path}")
            except Exception as e:
                logger.error(f"Failed to retrieve file from GridFS: {str(e)}")
                return jsonify({'error': 'File not found'}), 404
        
        # Process the audio
        logger.info(f"Processing file: {file_path}")
        data_extractor = DataExtractor(base_output_dir=OUTPUT_FOLDER)
        data_extractor.load_file(file_path, user_id=user_id)
        
        # Generate visualizations
        waveform_path = data_extractor.save_waveform()
        harmonic_path = data_extractor.save_harmonic_percussive()
        
        # Convert full paths to relative URLs
        waveform_url = f"/outputs/{user_id}/waveform.png"
        harmonic_url = f"/outputs/{user_id}/harmonic_percussive.png"
        
        logger.info(f"Successfully processed audio for user {user_id}")
        
        # Return success response with plot URLs
        return jsonify({
            'status': 'success',
            'message': 'Audio processed successfully',
            'plot_urls': {
                'waveform': waveform_url,
                'harmonic': harmonic_url
            },
            'waveform_url': waveform_url,
            'harmonic_url': harmonic_url
        }), 200
        
    except Exception as e:
        logger.error(f"Error processing audio: {str(e)}")
        return jsonify({
            'status': 'error',
            'error': 'Internal server error',
            'details': str(e)
        }), 500
@app.route('/check_user', methods=['POST'])
def check_user():
    try:
        data = request.json
        user_id = data.get('id')

        if not user_id:
            return jsonify({"error": "No user ID provided"}), 400

        # Check if user exists by ID
        existing_user = mongo.db.users.find_one({"id": user_id})
        
        return jsonify({
            "exists": existing_user is not None
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/upload/<user_id>', methods=['GET', 'POST'])
def upload_file(user_id):
    try:
        logger.info(f"New upload request received for user: {user_id}")
        
        # Validate request method
        if request.method != 'POST':
            return jsonify({"message": "Method not allowed"}), 405
            
        # Validate file presence
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
            
            # Create user-specific folder structure
            user_folder = os.path.join(UPLOAD_FOLDER, user_id)
            
            # Delete all existing files in the user's folder
            if os.path.exists(user_folder):
                logger.info(f"Cleaning up existing files in {user_folder}")
                for existing_file in os.listdir(user_folder):
                    file_path = os.path.join(user_folder, existing_file)
                    try:
                        if os.path.isfile(file_path):
                            os.unlink(file_path)
                            logger.info(f"Deleted existing file: {file_path}")
                    except Exception as e:
                        logger.error(f"Error deleting file {file_path}: {str(e)}")
            else:
                # Create the directory if it doesn't exist
                os.makedirs(user_folder, exist_ok=True)
            
            # Save to local filesystem in user-specific folder
            upload_path = os.path.join(user_folder, filename)
            logger.debug(f"Saving file to local filesystem: {upload_path}")
            file.save(upload_path)
            logger.info(f"File saved to local filesystem: {upload_path}")
            
            # Save to GridFS with user ID in metadata
            file.seek(0)
            content_type = file.content_type if hasattr(file, 'content_type') else 'application/octet-stream'
            gridfs_file_id = fs.put(
                file,
                filename=filename,
                content_type=content_type,
                metadata={
                    'user_id': user_id,
                    'original_filename': filename,
                    'content_type': content_type,
                    'folder_path': user_folder
                }
            )
            logger.info(f"File saved to GridFS with ID: {gridfs_file_id}")
            
            # Update user document with new audio file reference
            result = mongo.db.users.update_one(
                {'id': user_id},
                {'$addToSet': {
                    'audio_files': {
                        'gridfs_id': gridfs_file_id,
                        'filename': filename,
                        'content_type': content_type,
                        'uploaded_at': datetime.utcnow(),
                        'file_path': upload_path
                    }
                }}
            )
            
            if result.modified_count == 0:
                # If user doesn't exist, create a new user document
                mongo.db.users.insert_one({
                    'id': user_id,
                    'audio_files': [{
                        'gridfs_id': gridfs_file_id,
                        'filename': filename,
                        'content_type': content_type,
                        'uploaded_at': datetime.utcnow(),
                        'file_path': upload_path
                    }]
                })
                logger.info(f"Created new user document for ID: {user_id}")
            
            return jsonify({
                'message': f'File {filename} uploaded successfully',
                'filename': filename,
                'filepath': upload_path,
                'gridfs_id': str(gridfs_file_id)
            }), 200
            
    except Exception as e:
        logger.error(f"Upload failed: {str(e)}")
        return jsonify({
            'error': 'Upload failed',
            'details': str(e)
        }), 500

@app.route('/outputs/<path:path>')
def serve_output(path):
    """Serve static files from the outputs directory"""
    try:
        logger.info(f"Serving output file: {path}")
        return send_from_directory(OUTPUT_FOLDER, path)
    except Exception as e:
        logger.error(f"Error serving output file: {str(e)}")
        return jsonify({'error': 'File not found'}), 404

@app.route('/files', methods=['GET'])
def get_user_files():
    try:
        user_id = request.args.get('userId')
        if not user_id:
            return jsonify({'error': 'User ID is required'}), 400
        
        user = mongo.db.users.find_one({'id': user_id})
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        audio_files = user.get('audio_files', [])
        return jsonify(audio_files)
    except Exception as e:
        logger.error(f"Error fetching user files: {str(e)}")
        return jsonify({'error': 'Failed to fetch files'}), 500

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

# Route to add users to the users collection
@app.route('/user', methods=['POST'])  # Fixed missing @ decorator
def add_user():
    try:
        logger.info("New user registration request received")
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        required_fields = ['fullName', 'email', 'id']
        if any(field not in data or not data[field] for field in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400
        
        user_id = data['id']
        existing_user = mongo.db.users.find_one({"id": user_id})
        
        if existing_user:
            # Check if any audio files exist in GridFS
            if 'audio_files' in existing_user:
                for audio_file in existing_user['audio_files']:
                    try:
                        # Try to delete from GridFS
                        fs.delete(audio_file['gridfs_id'])
                        logger.info(f"Deleted audio file {audio_file['filename']} from GridFS")
                    except Exception as e:
                        logger.error(f"Failed to delete audio file {audio_file['filename']}: {str(e)}")
            
            return jsonify({
                'message': 'User already exists',
                'user': existing_user
            }), 200
        
        # Create new user
        user_data = {
            'fullName': data['fullName'],
            'email': data['email'],
            'id': user_id,
            'audio_files': []  # Initialize empty array for future audio files
        }
        
        result = mongo.db.users.insert_one(user_data)
        return jsonify({
            'message': 'User added successfully',
            'inserted_id': str(result.inserted_id),
            'user': user_data
        }), 201
        
    except Exception as e:
        logger.error(f"User registration failed: {str(e)}")
        return jsonify({
            'error': 'User registration failed',
            'details': str(e)
        }), 500

# Add a route to retrieve files from GridFS
@app.route('/files/<file_id>', methods=['GET'])
def get_file(file_id):
    try:
        logger.info(f"Retrieving file with ID: {file_id}")
        
        # Convert string ID to ObjectId
        try:
            file_id = ObjectId(file_id)
        except:
            logger.warning(f"Invalid file ID format: {file_id}")
            return jsonify({'error': 'Invalid file ID format'}), 400
        
        # Check if the file exists in GridFS
        if not fs.exists({"_id": file_id}):
            logger.warning(f"File with ID {file_id} not found in GridFS")
            return jsonify({'error': 'File not found'}), 404
        
        grid_out = fs.get(file_id)
        content_type = grid_out.content_type
        filename = grid_out.filename
        
        return send_file(
            io.BytesIO(grid_out.read()),
            mimetype=content_type,
            as_attachment=True,
            download_name=filename
        )
    
    except Exception as e:
        logger.error(f"File retrieval failed: {str(e)}")
        return jsonify({
            'error': 'File retrieval failed',
            'details': str(e)
        }), 500


if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)