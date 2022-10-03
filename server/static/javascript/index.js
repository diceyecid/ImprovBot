// backend api
const api = 'http://127.0.0.1:5000/api/';

// get buttons
const startBtn = document.getElementById( 'start' );
const stopBtn = document.getElementById( 'stop' );
const downloadLink = document.getElementById( 'download' );

// find supported recording type
const findType = () =>
{
	const types = [ 'wav', 'mp3', 'mp4', 'webm' ];

	for( t of types )
	{
		if( MediaRecorder.isTypeSupported( 'audio/' + t ) )
			return t;
	}

	return '';
};

// display bot message from backend response
const displayBotMessages = ( messages ) =>
{
	const botMessages = document.getElementById( 'bot-messages' );

	for( let msg of messages )
	{
		const msgItem = document.createElement( 'li' );
		msgItem.innerText = msg;
		botMessages.appendChild( msgItem );
	}
};

// recorder function
const recordVoice = ( stream ) => 
{
	// find recording type
	const mediaType = findType();
	if( mediaType == '' )
	{
		console.log( 'Media type not supported' );
		return;
	}

	// initiate media recorder
	const options = { mimeType: 'audio/' + mediaType };
	const mediaRecorder = new MediaRecorder( stream, options );
	const recordedChunks = [];

	// recording 
	mediaRecorder.addEventListener( 'dataavailable', ( e ) =>
	{
		if( e.data.size > 0 )
			recordedChunks.push( e.data );
	} );

	// finished recording and construct audio file
	mediaRecorder.addEventListener( 'stop', () =>
	{
		// download link
		const file = new Blob( recordedChunks, { type: 'audio/' + mediaType } );
		downloadLink.href = URL.createObjectURL( file );
		downloadLink.download = 'test.' + mediaType;

		// send to backend
		console.log( file );
		const data = new FormData();
		data.append( 'file', file, 'test.' + mediaType );
		fetch( api + 'userMessage', { method: 'POST', body: data } )
			.then( res => res.json() )
			.then( data =>
			{
				console.log( data );
				if( data.success )
					displayBotMessages( data.message );
				else
					console.log( data.message );
			} );
	} );

	// stop button
	stopBtn.addEventListener( 'click', () =>
	{
		mediaRecorder.stop();
	} );

	// start recording
	mediaRecorder.start();
	console.log( 'start' )
};

startBtn.addEventListener( 'click', () =>
{
	// ask permission and then record
	navigator.mediaDevices.getUserMedia( { audio: true, video: false } )
		.then( recordVoice );
} );
