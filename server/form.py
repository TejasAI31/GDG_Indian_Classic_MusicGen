# importing Flask and other modules
from flask import Flask, request
 
# Flask constructor
app = Flask(__name__)   
 
# A decorator used to tell the application
# which URL is associated function
@app.route('/', methods =["GET", "POST"])
def upload_file():
    if request.method == "POST":
        uploaded_file = request.files['file']
        for file in uploaded_file:
            print(file)
 
if __name__=='__main__':
   app.run(debug= True)