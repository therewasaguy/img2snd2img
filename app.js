var audioContext;
var ctx;
var colorDensity = 40;
var soundFilePre, soundFilePost;

function setup() {
	cnv = createCanvas(500, 500);
	ctx = cnv.elt.getContext('2d');
	background(0);
	pixelDensity(1);
	noStroke();

	initAudio();

	drawGradient();

	soundFilePre = new p5.SoundFile();
	soundFilePost = new p5.SoundFile();

	frameRate(10);
}

function draw() {
	var pxls = ctx.getImageData(0, 0, width, height).data;

	createAudioBuffer(pxls);
	createOfflineBuffer(pxls);
}


function initAudio() {
	audioContext = getAudioContext();
}


function mousePressed() {
	var pxls = ctx.getImageData(0, 0, width, height).data;

	createAudioBuffer(pxls);
	createOfflineBuffer(pxls);
}


function createAudioBuffer(imageData) {
	var channels = 1;
	var frameCount = Math.floor( imageData.length / channels );
	var audioBuffer = audioContext.createBuffer(channels, frameCount, audioContext.sampleRate);

	fillAudio(audioBuffer, imageData, frameCount, channels);
	// for (var channel = 0; channel < channels; channel++) {
	// 	var nowBuffering = audioBuffer.getChannelData(channel);

	// 	for (var i = 0; i < frameCount; i++) {
	// 		nowBuffering[i] = map(imageData[i], 0, 255, -1, 1);
	// 		// nowBuffering[i] = imageData[i];
	// 	}
	// }

	soundFilePre.buffer = audioBuffer;
}

function createOfflineBuffer(imageData) {
	var channels = 1;
	var frameCount = Math.floor( imageData.length / channels );
	var offlineCtx = new OfflineAudioContext(channels, frameCount, 44100);

	offlineCtx.oncomplete = function(e) {
		soundFilePost.buffer = e.renderedBuffer

		// dispose of offline context
		// offlineCtx.close();
		offlineCtx = undefined;

		fillImage(e.renderedBuffer);

	  console.log("completed!");
	}

	var audioBuffer = offlineCtx.createBuffer(channels, frameCount, audioContext.sampleRate);

	fillAudio(audioBuffer, imageData, frameCount, channels);

	delayNode = offlineCtx.createDelay();
	delayNode.delayTime.value = 0.01;
	var gainNode = offlineCtx.createGain();
	gainNode.gain.value = 0.2;
	delayNode.connect(gainNode);
	var filterNode = offlineCtx.createBiquadFilter();
	gainNode.connect(filterNode);
	filterNode.connect(delayNode);

	var bufferSource = offlineCtx.createBufferSource();
	bufferSource.buffer = audioBuffer;

	bufferSource.connect(delayNode);
	delayNode.connect(offlineCtx.destination);

	bufferSource.start();
	offlineCtx.startRendering();
}


// take an array buffer of some data, and fill an audio buffer with that data
function fillAudio(audioBuffer, imageData, frameCount, channels) {
	for (var channel = 0; channel < channels; channel++) {
		// This gives us the actual ArrayBuffer that contains the data
		var nowBuffering = audioBuffer.getChannelData(channel);

		for (var i = 0; i < frameCount; i++) {
			nowBuffering[i] = imageData[i];
			// nowBuffering[i] = map(imageData[i], 0, 255, -1, 1);
		}
	}
}

function fillImage(audioBuffer) {
	var imageData;
	var audioData = audioBuffer.getChannelData(0);

	// TO DO: for every channel...?

	var imageDataArray = new Uint8ClampedArray(audioBuffer.length);
	for (var i = 0; i < audioBuffer.length; i++) {
		imageDataArray[i] = Math.round(audioData[i]) % 254;
	}

	imageData = new ImageData(imageDataArray, width, height);
	imageData.data = imageDataArray;
	ctx.putImageData(imageData, 0, 0, 0, 0, width, height);
}


function drawGradient() {
	colorDensity = floor(random(2, 100));
	colorMode(HSB, colorDensity);
	var pixelSize = width / colorDensity;

	for (i = 0; i < colorDensity; i++) {
		for (j = 0; j < colorDensity; j++) {
			fill(i, j, colorDensity, 100);
			rect(i * pixelSize, j*pixelSize, pixelSize, pixelSize);
		}
	}
}