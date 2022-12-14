// backend api
const api = 'http://127.0.0.1:5000/api/';

// get html elements
const clientImg = document.getElementById( 'client-img' );
const speakBtn = document.getElementById( 'speak-btn' );
const mutedIcon = document.getElementById( 'muted-icon' );
const unmutedIcon = document.getElementById( 'unmuted-icon' );
const audio = document.getElementById( 'audio' );

// flag to determine if user is recording
let isSpeaking = false;

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

// recorder function
const prepareRecording = ( stream ) => 
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
	let recordedChunks = [];

	// recording 
	mediaRecorder.addEventListener( 'dataavailable', ( e ) =>
	{
		if( e.data.size > 0 )
			recordedChunks.push( e.data );
	} );

	// finished recording and construct audio file
	mediaRecorder.addEventListener( 'stop', () =>
	{
		// construct file
		const file = new Blob( recordedChunks, { type: 'audio/' + mediaType } );
		console.log( file );

		// send to backend
		const data = new FormData();
		data.append( 'file', file, 'test.' + mediaType );
		fetch( api + 'userMessage', { method: 'POST', body: data } )
			.then( res =>
			{
				console.log( res );
				if( res.status == 200 )
				{
					res.json()
						.then( data => 
						{
							// fetch audio
							fetch( api + 'botMessage/' + data.audio )
								.then( res => res.blob() )
								.then( audioBlob =>
								{
									// add audio to player
									const audioURL = URL.createObjectURL( audioBlob );
									audio.src = audioURL;
									audio.play();
								} );

							if( data.image != '' )
							{
								// fetch expression image
								fetch( api + 'asset/' + data.image )
									.then( res => res.blob() )
									.then( imgBlob =>
									{
										const imgURL = URL.createObjectURL( imgBlob );
										clientImg.src = imgURL;
									} );
							}
							
						} );
				}
				else if( res.status == 400 )
				{
					// something went wrong
					res.json()
						.then( data => console.log( data.message ) );
				}
			} )

		// clear recordedChunks
		recordedChunks = [];
	} );

	speakBtn.addEventListener( 'click', () =>
	{
		if( isSpeaking )
		{
			// stop recording
			mediaRecorder.stop();
			//speakBtn.innerHTML = 'Start Speaking';
			mutedIcon.style.display = 'block';
			unmutedIcon.style.display = 'none';
			isSpeaking = false;
			console.log( 'stop' );
		}
		else
		{
			// start recording
			mediaRecorder.start();
			isSpeaking = true;
			mutedIcon.style.display = 'none';
			unmutedIcon.style.display = 'block';
			//speakBtn.innerHTML = 'Stop Speaking';
			console.log( 'start' );
		}
	} );
};

// ask user for recording permission
navigator.mediaDevices.getUserMedia( { audio: true, video: false } )
	.then( prepareRecording );
