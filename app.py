from flask import Flask, redirect, url_for, request, render_template
import requests
import json

RASA_API = 'http://localhost:5005/webhooks/rest/webhook'

app = Flask( __name__, template_folder = 'templates' )

@app.route( '/', methods = [ 'POST', 'GET' ] )
def message():
    # get user message
    msg = str( request.args.get( 'text' ) )

    # construct http request to Rasa
    data = json.dumps( { 'sender': 'Rasa', 'message': msg } )
    headers = { 'Content-type': 'application/json', 'Accept': 'text/plain' }

    # request to Rasa
    res = requests.post( RASA_API, data = data, headers = headers )
    res = res.json()

    print( res )

    replies = []
    for i in range( len( res ) ):
        try:
            replies.append( res[i]['text'] )
        except:
            continue

    return render_template( 'index.html', botMessages = replies )

if __name__ == '__main__':
    app.run()
