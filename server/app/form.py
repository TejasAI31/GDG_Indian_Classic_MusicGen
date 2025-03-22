from flask import Flask, request, jsonify, render_template
from werkzeug.utils import secure_filename
from flask_cors import CORS
import os

app = Flask(__name__)

CORS(app) # Enables CORS for all routes.

UPLOAD_FOLDER = 'uploads'
TEMPLATE_FOLDER = 'templates'

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

@app.route('/')
def test_backend():
  return render_template('test.html')

@app.route('/upload', methods=['GET', 'POST'])
def upload_file():
    if request.method == 'POST':
        if 'file' not in request.files:
            return jsonify({'error': 'No file part'}), 400
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
        if file:
            filename = secure_filename(file.filename)
            print(filename)
            file.save(app.config['UPLOAD_FOLDER'] + filename)
            return jsonify({'message': 'File uploaded successfully'}), 200
        return jsonify({'error': 'An error occurred'}), 500
    return render_template('upload.html') #Render the upload form

    
if __name__ == '__main__':
  app.run(debug=True)