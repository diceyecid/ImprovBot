#---------- imports ----------#


from flask import Flask, redirect, url_for, request, render_template, flash, jsonify
from werkzeug.utils import secure_filename
import requests
import os
import json
import whisper


#---------- constants ----------#


RASA_API = 'http://localhost:5005/webhooks/rest/webhook'
RECORDING_DIR = './recordings'
VALID_EXT = [ 'wav', 'mp3', 'mp4', 'webm' ]
STT_MODEL = whisper.load_model( 'base' )


#---------- flask app configs ----------#


app = Flask( __name__, template_folder = 'templates' )
app.config['UPLOAD_FOLDER'] = RECORDING_DIR


#---------- helper functions ----------#


# check if file is in the right format
def isFileValid( filename ):
    return '.' in filename and filename.rsplit( '.', 1 )[1].lower() in VALID_EXT

# save user audio files to server
def saveFile( files ):
    # check if there is the file part
    if 'file' not in files:
        return False

    file = files.get( 'file' )

    # check if there is file name
    if file.filename == '':
        return False

    # save audio file
    if file and isFileValid( file.filename ):
        filename = secure_filename( file.filename )
        with open( os.path.join( app.config['UPLOAD_FOLDER'], filename ), 'wb' ) as f:
            f.write( file.read() )
        return file.filename

    return False

# get reply from rasa bot
def getReply( msg ):
    # construct http request to Rasa
    data = json.dumps( { 'sender': 'Rasa', 'message': msg } )
    headers = { 'Content-type': 'application/json', 'Accept': 'text/plain' }

    # request to Rasa
    res = requests.post( RASA_API, data = data, headers = headers )
    res = res.json()
    return res


#---------- routes ----------#


@app.route( '/', methods = [ 'POST', 'GET' ] )
def index():
    return render_template( 'index.html' )

@app.post( '/api/userMessage' )
def userMessage():
    # save audio file
    files = request.files
    filename = saveFile( files )
    if not filename:
        return jsonify( success = False, message = 'Failed to save file' )

    # speech-to-text
    msg = STT_MODEL.transcribe( audio = os.path.join( RECORDING_DIR, filename ), 
                                language = 'en' )
    print( msg )

    # loop replies
    res = getReply( msg['text'] )
    replies = []
    for i in range( len( res ) ):
        try:
            replies.append( res[i]['text'] )
        except:
            continue

    return jsonify( success = True, message = replies )


#---------- main ----------#


if __name__ == '__main__':
    app.run()
