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
}

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
		downloadLink.href = URL.createObjectURL( new Blob( recordedChunks ) );
		downloadLink.download = 'test.' + mediaType;
	} );

	// stop button
	stopBtn.addEventListener( 'click', () =>
	{
		mediaRecorder.stop();
	} );

	// start recording
	mediaRecorder.start();
}

startBtn.addEventListener( 'click', () =>
{
	// ask permission and then record
	navigator.mediaDevices.getUserMedia( { audio: true, video: false } )
		.then( recordVoice );
} );
