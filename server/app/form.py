import random
import string
from bson import ObjectId
from flask import Flask, request, jsonify, render_template, send_file, send_from_directory
from pymongo import ReturnDocument
from pymongo.errors import OperationFailure
from werkzeug.utils import secure_filename
from flask_cors import CORS
import os
import logging
from flask_pymongo import PyMongo
import gridfs
import io
from datetime import datetime

from MusicGenerator import generate_music

from GenreAnalysis import AnalyseGenre, InitializeModels
from InstrumentAnalysis import InstrumentAnalyzer
from DataExtractor import DataExtractor
#from DataExtractor import AnalyseGenre,InitializeModels
# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
app = Flask(__name__)

# Connect to Musicgen database
#app.config['MONGO_URI'] = "mongodb+srv://omeshmehta03:Mav6zX7W8tpVyTSo@cluster0.9xnlqg6.mongodb.net/Music?retryWrites=true&w=majority&tls=true&tlsAllowInvalidCertificates=false&ssl=true"
#this is for production
app.config['MONGO_URI'] = "mongodb://localhost:27017/Musicgen"  

#app.config['MONGO_URI'] = "mongodb://localhost:27017/Musicgen"
mongo = PyMongo(app)
db = mongo.db
# Define metadata collection
metadata_collection = mongo.db.selected_audios

# Set up GridFS
fs = gridfs.GridFS(mongo.db)
ALLOWED_EXTENSIONS = {'mp3'}
# Define absolute paths for better reliability
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)  # Ensure base uploads folder exists
OUTPUT_FOLDER = os.path.join(BASE_DIR, 'outputs')
os.makedirs(OUTPUT_FOLDER, exist_ok=True)  # Ensure outputs folder exists

# Configure CORS
cors_config = {
    "origins": ["http://localhost:3000"],
    "methods": ["GET", "POST", "DELETE","OPTIONS"],
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
ALLOWED_EXTENSIONS = {'mp3'}
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
# Audio Upload Route
@app.route('/generate-music', methods=['POST'])
def generate_music_endpoint():
    try:
        # Get JSON data from request
        data = request.json
        
        # Extract parameters
        prompt = data.get('prompt')
        duration = float(data.get('duration', 5))  # Default to 5 seconds
        username = data.get('username')
        
        # Validate inputs
        if not prompt or not username:
            return jsonify({'error': 'Missing required parameters'}), 400
            
        # Limit duration for resource management
        if duration > 30:
            return jsonify({'error': 'Duration cannot exceed 30 seconds'}), 400
        
        # Generate the music
        output_path = generate_music(prompt, duration, username)
        
        # Return the file path that can be used to download the file
        return jsonify({
            'success': True,
            'file_path': f'/api/download/{username}'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/download/<username>', methods=['GET'])
def download_file(username):
    """Endpoint to download the generated music file"""
    try:
        # Ensure the username is safe
        safe_username = "".join(c for c in username if c.isalnum() or c in "._-")
        file_path = os.path.join('out', safe_username, 'generated.mp3')
        
        # Check if file exists
        if not os.path.exists(file_path):
            return jsonify({'error': 'File not found'}), 404
            
        return send_file(file_path, as_attachment=True)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
@app.route('/api/upload-audio/<user_id>', methods=['POST'])
def upload_audio(user_id):
    try:
        logger.info(f"New audio upload request received for user: {user_id}")
        
        # Validate file presence
        if 'audio' not in request.files:
            logger.warning("No audio file part in request")
            return jsonify({'error': 'No audio file provided'}), 400
        
        audio_file = request.files['audio']
        if audio_file.filename == '':
            logger.warning("Empty filename provided")
            return jsonify({'error': 'No selected file'}), 400
        
        # Validate file type
        if not audio_file.content_type.startswith('audio/'):
            logger.warning(f"Invalid file type: {audio_file.content_type}")
            return jsonify({'error': 'File must be an audio file'}), 400
        
        # Validate file size (50MB limit)
        if audio_file.content_length > 50 * 1024 * 1024:
            return jsonify({'error': 'File size exceeds 50MB limit'}), 400
        
        # Get metadata from form
        description = request.form.get('description', '')
        tags = request.form.get('tags', '').split(',') if request.form.get('tags') else []
        
        # Create metadata document
        metadata = {
            'user_id': user_id,
            'filename': secure_filename(audio_file.filename),
            'original_filename': audio_file.filename,
            'content_type': audio_file.content_type,
            'description': description,
            'tags': tags,
            'uploaded_at': datetime.utcnow()
        }
        
        # Store file in GridFS
        audio_file.seek(0)  # Reset file pointer to beginning
        gridfs_file_id = fs.put(
            audio_file,
            filename=secure_filename(audio_file.filename),
            content_type=audio_file.content_type,
            metadata=metadata
        )
        logger.info(f"Audio saved to GridFS with ID: {gridfs_file_id}")
        
        # Return success response
        return jsonify({
            'success': True,
            'message': 'File uploaded successfully',
            'filename': secure_filename(audio_file.filename),
            'file_id': str(gridfs_file_id)
        }), 200
        
    except Exception as e:
        logger.error(f"Error uploading audio: {str(e)}")
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@app.route('/api/audio-files/<user_id>', methods=['GET'])
def get_user_audio_files(user_id):
    try:
        # Get all audio files for the user from metadata collection
        files = list(metadata_collection.find({'user_id': user_id}))
        
        # Convert ObjectId to string for JSON serialization
        for file in files:
            file['_id'] = str(file['_id'])
            file['fileId'] = str(file['fileId'])
        
        return jsonify({
            'success': True,
            'files': files
        }), 200
    
    except Exception as e:
        logger.error(f"Error getting audio files: {str(e)}")
        return jsonify({'error': f'Server error: {str(e)}'}), 500
@app.route('/process-audio/<user_id>', methods=['POST'])
def process_audio(user_id):
    try:
        logger.info(f"Processing audio for user: {user_id}")
        user = mongo.db.users.find_one({'id': user_id})
        if not user:
            logger.error(f"User {user_id} not found")
            return jsonify({'error': 'User not found'}), 404
        
        audio_files = user.get('audio_files', [])
        if not audio_files:
            logger.error(f"No audio files found for user {user_id}")
            return jsonify({'error': 'No audio files found for user'}), 404
        
        # Get the latest file
        latest_file = sorted(audio_files, key=lambda x: x['uploaded_at'], reverse=True)[0]
        file_path = latest_file['file_path']
        filename = latest_file['filename']
        
        # Create user directory if it doesn't exist
        user_folder = os.path.join(UPLOAD_FOLDER, user_id)
        os.makedirs(user_folder, exist_ok=True)
        
        # Clean up existing files in the folder
        for existing_file in os.listdir(user_folder):
            existing_path = os.path.join(user_folder, existing_file)
            try:
                if os.path.isfile(existing_path):
                    os.unlink(existing_path)
                    logger.info(f"Deleted existing file: {existing_path}")
            except Exception as e:
                logger.error(f"Error deleting file {existing_path}: {str(e)}")
        
        # Process the audio file
        if not os.path.exists(file_path):
            gridfs_id = latest_file['gridfs_id']
            grid_out = fs.get(gridfs_id)
            with open(file_path, 'wb') as f:
                f.write(grid_out.read())
            logger.info(f"Restored file from GridFS to {file_path}")
        
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

        # **Call predict_genre internally**
        genre = AnalyseGenre(file_path)

        if genre == -1:
            logger.warning("No available models. Attempting to reinitialize...")
            InitializeModels(5)
            genre = AnalyseGenre(file_path)
            
            if genre == -1:
                return jsonify({'error': 'No available models to process genre'}), 503

        logger.info(f"Successfully processed audio for user {user_id} with predicted genre: {genre}")

        return jsonify({
            'status': 'success',
            'message': 'Audio processed and genre predicted successfully',
            'plot_urls': {
                'waveform': waveform_url,
                'harmonic': harmonic_url
            },
            'waveform_url': waveform_url,
            'harmonic_url': harmonic_url,
            'genre': genre  
        }), 200
        
    except Exception as e:
        logger.error(f"Error processing audio: {str(e)}")
        return jsonify({
            'status': 'error',
            'error': 'Internal server error',
            'details': str(e)
        }), 500
@app.route('/analyze-instruments/<user_id>', methods=['POST'])
def analyze_music(user_id):
    """
    Comprehensive music analysis for a user's latest audio file.
    
    Returns:
        JSON response with:
        - genre analysis
        - instrument analysis (with probabilities)
        - key/tempo analysis
        - audio features
    """
    try:
        logger.info(f"Starting music analysis for user: {user_id}")
        
        # Validate user exists
        user = mongo.db.users.find_one({'id': user_id})
        if not user:
            logger.error(f"User {user_id} not found")
            return jsonify({
                'status': 'error',
                'error': 'User not found',
                'details': 'User ID not found in database'
            }), 404
        
        # Get audio files and validate
        audio_files = user.get('audio_files', [])
        if not audio_files:
            logger.error(f"No audio files found for user {user_id}")
            return jsonify({
                'status': 'error',
                'error': 'No audio files found',
                'details': 'User has no uploaded audio files'
            }), 404
        
        # Get latest file
        latest_file = sorted(audio_files, key=lambda x: x['uploaded_at'], reverse=True)[0]
        file_path = latest_file['file_path']
        
        # Handle file retrieval from GridFS if needed
        if not os.path.exists(file_path):
            try:
                gridfs_id = latest_file['gridfs_id']
                grid_out = fs.get(gridfs_id)
                with open(file_path, 'wb') as f:
                    f.write(grid_out.read())
                logger.info(f"Successfully restored file from GridFS to {file_path}")
            except gridfs.NoFile:
                logger.error(f"GridFS file not found for ID: {gridfs_id}")
                return jsonify({
                    'status': 'error',
                    'error': 'File not found',
                    'details': 'GridFS file not accessible'
                }), 404
            except OperationFailure as e:
                logger.error(f"GridFS operation failed: {str(e)}")
                return jsonify({
                    'status': 'error',
                    'error': 'Database error',
                    'details': 'Failed to retrieve file from GridFS'
                }), 500
        
        # Perform all analyses
        from InstrumentAnalysis import InstrumentAnalyzer
        from GenreAnalysis import AnalyseGenre
        
        genre = AnalyseGenre(file_path)
        instrument_analysis = InstrumentAnalyzer.analyze_instrument(file_path)
        key_tempo_analysis = InstrumentAnalyzer.analyze_key_tempo(file_path)
        
        # Compile final results
        result = {
            'status': 'success',
            'file_path': file_path,
            'analyses': {
                'genre': genre if isinstance(genre, str) else 'Unknown',
                'instrument': instrument_analysis,
                'key_tempo': key_tempo_analysis
            }
        }
        
        logger.info(f"Music analysis complete for user {user_id}")
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"Error analyzing music: {str(e)}")
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
@app.route('/api/random-audio', methods=['GET'])
def get_random_audio():
    try:
        # Specific user ID to fetch audio from
        user_id = "user_2tAWzAngClCUsUP1mB61AP12tjV"
        
        # Find the specific user's document
        user = db.users.find_one({"id": user_id})
        
        if not user:
            return jsonify({"error": "User not found"}), 404
            
        if 'audio_files' not in user or not user['audio_files']:
            return jsonify({"error": "No audio files found for this user"}), 404
        
        # Select a random audio file from this user's files
        random_audio = random.choice(user['audio_files'])
        
        # Get the file from GridFS
        gridfs_id = random_audio['gridfs_id']
        audio_file = fs.get(ObjectId(gridfs_id))
        
        # Send the file with appropriate content type
        return send_file(
            audio_file,
            mimetype=random_audio.get('content_type', 'audio/mpeg'),
            as_attachment=False,
            download_name=random_audio.get('filename', 'audio.mp3')
        )
    
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
@app.route('/upload-edit/<user_id>/<role>', methods=['POST'])
def upload_to_gridfs(user_id, role):
    try:
        logger.info(f"New upload request received for user: {user_id}, role: {role}")
        
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
            
            # Save directly to GridFS with enhanced metadata
            content_type = file.content_type if hasattr(file, 'content_type') else 'application/octet-stream'
            gridfs_file_id = fs.put(
                file,
                filename=filename,
                content_type=content_type,
                metadata={
                    'user_id': user_id,
                    'role': role,
                    'original_filename': filename,
                    'content_type': content_type,
                    'uploaded_at': datetime.utcnow()
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
                        'role': role,
                        'uploaded_at': datetime.utcnow()
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
                        'role': role,
                        'uploaded_at': datetime.utcnow()
                    }]
                })
                logger.info(f"Created new user document for ID: {user_id}")
            
            return jsonify({
                'message': f'File {filename} uploaded successfully',
                'filename': filename,
                'gridfs_id': str(gridfs_file_id),
                'role': role
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
@app.route('/files/<file_id>', methods=['DELETE'])
def delete_file(file_id):
    try:
        logger.info(f"Deleting file with ID: {file_id}")
        user_id = request.args.get('userId')
        
        if not user_id:
            return jsonify({'error': 'User ID is required'}), 400
        
        # Convert string ID to ObjectId
        try:
            file_id_obj = ObjectId(file_id)
        except:
            logger.warning(f"Invalid file ID format: {file_id}")
            return jsonify({'error': 'Invalid file ID format'}), 400
        
        # Find the user
        user = mongo.db.users.find_one({'id': user_id})
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Check if the file exists and belongs to the user
        file_exists = False
        for file in user.get('audio_files', []):
            if str(file.get('gridfs_id')) == str(file_id_obj):
                file_exists = True
                break
        
        if not file_exists:
            return jsonify({'error': 'File not found or does not belong to user'}), 404
        
        # Delete file from GridFS
        if fs.exists({"_id": file_id_obj}):
            fs.delete(file_id_obj)
        
        # Remove file reference from user document
        result = mongo.db.users.update_one(
            {'id': user_id},
            {'$pull': {'audio_files': {'gridfs_id': file_id_obj}}}
        )
        
        if result.modified_count == 0:
            return jsonify({'error': 'Failed to update user document'}), 500
        
        return jsonify({'message': 'File deleted successfully'}), 200
        
    except Exception as e:
        logger.error(f"File deletion failed: {str(e)}")
        return jsonify({
            'error': 'File deletion failed',
            'details': str(e)
        }), 500
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
@app.route('/generate-save/<user_id>', methods=['POST'])
def save_audio(user_id):
    try:
        logger.info(f"Received save request for user {user_id}")
        
        # Generate a unique filename using timestamp and a random string
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        random_suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
        unique_filename = f"audio_{timestamp}_{random_suffix}.mp3"
        
        # Source filename is still generated.mp3
        source_filename = "generated.mp3"
        
        # Check if user exists
        user = mongo.db.users.find_one({"id": user_id})
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Path to the user-specific subfolder containing generated.mp3
        out_folder = os.path.join(os.path.dirname(__file__), 'out')
        user_folder = os.path.join(out_folder, f"{user_id}")
        file_path = os.path.join(user_folder, source_filename)
        
        # Check if file exists
        if not os.path.exists(file_path):
            return jsonify({'error': f'Generated audio file not found in {user_folder}'}), 404
        
        # Read the file
        with open(file_path, 'rb') as audio_file:
            # Save to GridFS with the unique filename
            audio_id = fs.put(
                audio_file,
                filename=unique_filename,
                content_type='audio/mpeg'  # MP3 MIME type
            )
            
            # Update user document in generated-audio array
            mongo.db.users.update_one(
                {"id": user_id},
                {
                    "$push": {
                        "generated-audio": {
                            "gridfs_id": audio_id,
                            "filename": unique_filename,
                            "created_at": datetime.utcnow(),
                            "content_type": "audio/mpeg"
                        }
                    }
                }
            )
        
        logger.info(f"Successfully saved MP3 file {unique_filename} for user {user_id}")
        return jsonify({
            'success': True,
            'message': 'MP3 audio saved successfully',
            'filename': unique_filename
        })
        
    except Exception as e:
        logger.error(f"Failed to save audio: {str(e)}")
        return jsonify({'error': str(e)}), 500
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
            'audio_files': [],
            'generated-audio': [] # Initialize empty array for future audio files
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
@app.route('/files-generated', methods=['GET'])
def get_user_generated_files():
    try:
        user_id = request.args.get('userId')
        if not user_id:
            return jsonify({'error': 'User ID is required'}), 400
        
        user = mongo.db.users.find_one({'id': user_id})
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        generated_audio_files = user.get('generated-audio', [])
        return jsonify(generated_audio_files)
    except Exception as e:
        logger.error(f"Error fetching user generated files: {str(e)}")
        return jsonify({'error': 'Failed to fetch generated files'}), 500

@app.route('/files-generated/<file_id>', methods=['DELETE'])
def delete_generated_file(file_id):
    try:
        logger.info(f"Deleting generated file with ID: {file_id}")
        user_id = request.args.get('userId')
        
        if not user_id:
            return jsonify({'error': 'User ID is required'}), 400
        
        # Convert string ID to ObjectId
        try:
            file_id_obj = ObjectId(file_id)
        except:
            logger.warning(f"Invalid file ID format: {file_id}")
            return jsonify({'error': 'Invalid file ID format'}), 400
        
        # Find the user
        user = mongo.db.users.find_one({'id': user_id})
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Check if the file exists and belongs to the user
        file_exists = False
        for file in user.get('generated-audio', []):
            if str(file.get('gridfs_id')) == str(file_id_obj):
                file_exists = True
                break
        
        if not file_exists:
            return jsonify({'error': 'Generated file not found or does not belong to user'}), 404
        
        # Delete file from GridFS
        if fs.exists({"_id": file_id_obj}):
            fs.delete(file_id_obj)
        
        # Remove file reference from user document
        result = mongo.db.users.update_one(
            {'id': user_id},
            {'$pull': {'generated-audio': {'gridfs_id': file_id_obj}}}
        )
        
        if result.modified_count == 0:
            return jsonify({'error': 'Failed to update user document'}), 500
        
        return jsonify({'message': 'Generated file deleted successfully'}), 200
        
    except Exception as e:
        logger.error(f"Generated file deletion failed: {str(e)}")
        return jsonify({
            'error': 'Generated file deletion failed',
            'details': str(e)
        }), 500

@app.route('/files-generated/<file_id>', methods=['GET'])
def get_generated_file(file_id):
    try:
        logger.info(f"Retrieving generated file with ID: {file_id}")
        
        # Convert string ID to ObjectId
        try:
            file_id = ObjectId(file_id)
        except:
            logger.warning(f"Invalid file ID format: {file_id}")
            return jsonify({'error': 'Invalid file ID format'}), 400
        
        # Check if the file exists in GridFS
        if not fs.exists({"_id": file_id}):
            logger.warning(f"Generated file with ID {file_id} not found in GridFS")
            return jsonify({'error': 'Generated file not found'}), 404
        
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
        logger.error(f"Generated file retrieval failed: {str(e)}")
        return jsonify({
            'error': 'Generated file retrieval failed',
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