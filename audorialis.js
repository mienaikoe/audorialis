
window.requestAnimationFrame = 
		window.requestAnimationFrame || 
		window.webkitRequestAnimationFrame || 
		window.mozRequestAnimationFrame ||
		window.msRequestAnimationFrame;
		
window.AudioContext = 
		window.AudioContext || 
		window.webkitAudioContext;

if( !window.requestAnimationFrame || !window.AudioContext ){
	alert("It looks like your browser doesn't support this application. Please try a more modern Browser.");
}




var Audorialis = function(){
	this.acquireDomControls();
	this.instantiateAudioSystem();
	this.fetchMusicSource('music/Seabound.mp3');
	this.setVisualiser('Basic');
};


Audorialis.prototype.acquireDomControls = function(){
	this.controls = {
		play: document.getElementById("play"),
		gain: document.getElementById("gain"),
		mute: document.getElementById("mute"),
		file: document.getElementById("file")
	};
	this.playlist = document.getElementById("playlist");
	
	var self = this;
	this.controls.play.onclick = function(){
		if( self.playing ){
			self.stop();
		} else {
			self.play();
		}
	};
	this.controls.gain.onchange = function(){
		self.gain.gain.value = parseFloat(this.value);
	};
	this.controls.mute.onclick = function(){
		if( self.muted ){
			self.controls.gain.value = self.unmuteLevel;
			self.muted = false;
		} else {
			self.unmuteLevel = self.gain.gain.value;
			self.controls.gain.value = 0;
			self.muted = true;
		}
		self.controls.gain.onchange();
	};
	this.controls.file.onchange = function(){
		self.parseMusicSource(this.files[0]);
	};
};


Audorialis.prototype.instantiateAudioSystem = function(){
	this.ctx = new AudioContext();
	
	this.musicSource = this.ctx.createBufferSource();
	this.leftOff = 0;
	this.analyser = this.ctx.createAnalyser();
	this.analyser.fftSize = 256;
	this.gain = this.ctx.createGainNode();
	this.gain.gain.value = 0.5;
	
	this.audioMather = new AudioMather(this.analyser);
	
	this.musicSource.connect(this.analyser);
	this.audioMather.analyser.connect(this.gain);
	this.gain.connect(this.ctx.destination);
};



Audorialis.prototype.fetchMusicSource = function( url ){	
	var self = this;
	
    var request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.responseType = "arraybuffer";
    request.onload = function() {
        self.ctx.decodeAudioData(
            request.response,
            function(buffer) { 
				self.buffer = buffer;
				self.musicSource.buffer = buffer;
				self.playlist.innerHTML = url;
				self.stop();
				self.leftOff = 0;
            },
            function() { 
				alert(url+" Is Invalid. Please Try Again"); 
			}
        );
    };
	
	try{
		request.send();
	} catch(err) { 
		alert(url+" Is Invalid. Please Try Again"); 
	}
};

Audorialis.prototype.parseMusicSource = function( file ){
	var self = this;
	var reader = new FileReader();
	reader.onload = function() { 
		self.ctx.decodeAudioData(
			this.result, 
			function(buffer){
				self.buffer = buffer;
				self.musicSource.buffer = buffer;
				self.playlist.innerHTML = file.name;
				self.stop();
				self.leftOff = 0;
			},
			function(){
				alert(file.name+" Is Invalid. Please Try Again"); 
			});
	};
	
	try{
		reader.readAsArrayBuffer(file);
	} catch(err) { 
		alert(url+" Is Invalid. Please Try Again"); 
	}
    
};



Audorialis.prototype.setVisualiser = function(handle){
	var visualiserConstructor = window[handle];
	if( !visualiserConstructor ){
		this.loadVisualiser(handle);
	} else {
		this.visualiser = new visualiserConstructor(document.getElementById("visualiser"), this.audioMather);
	}
};

Audorialis.prototype.loadVisualiser = function(handle){
	if( this.loadedVisualisers ){
		if( this.loadedVisualisers.indexOf(handle) !== -1 ){
			console.error("Visualiser "+handle+" could not be loaded");
			return;
		} else {
			this.loadedVisualisers.push(handle);
		}
	} else {
		this.loadedVisualisers = [handle];
	}
	
	var visualiserJavascript = document.createElement('script');
	visualiserJavascript.setAttribute("type","text/javascript");
	visualiserJavascript.setAttribute("src","visualisers/"+handle+".js");
	document.head.appendChild(visualiserJavascript);

	var self = this;
	visualiserJavascript.onload = function(){
		self.setVisualiser(handle); 
	};
};





Audorialis.prototype.readyToPlay = function(){
	if( !this.buffer ){
		console.error("Music Buffer Needed");
	} else if ( !this.visualiser ) {
		console.error("Visualiser Needed");
	} else {
		return true;
	}
	return false;
};





Audorialis.prototype.play = function(){
	if( !this.playing ){
		if( !this.readyToPlay() ){ return; }
		this.playing = true;
		this.musicSource.start(0, this.leftOff);
		requestAnimationFrame(this.frame.bind(this));
	}
};

Audorialis.prototype.stop = function(){
	if( this.playing ){
		this.playing = false;
		this.musicSource.stop(0);
		this.musicSource.disconnect(0);

		this.musicSource = this.ctx.createBufferSource();
		this.musicSource.buffer = this.buffer;
		this.musicSource.connect(this.analyser);
	}
};

Audorialis.prototype.frame = function( timestamp ){
	if( !this.playing ){
		this.leftOff = this.leftOff + (this.ctx.currentTime - this.startCtxTime);
		this.startCtxTime = null;
		this.startTimestamp = null;
		return;
	}
	if( !this.startTimestamp ){
		this.startCtxTime = this.ctx.currentTime;
	    this.startTimestamp = timestamp;
	}
	
	this.visualiser.frame(timestamp);
	
	requestAnimationFrame(this.frame.bind(this));
};










var AudioMather = function( analyser ){
	this.analyser = analyser;
	this.nyquist = analyser.context.sampleRate/2;
	
	this.timeCap = analyser.fftSize;
	this.timeDomain = new Uint8Array(this.timeCap);
	
	this.frequencyCap = analyser.frequencyBinCount;
	this.frequencyDomain = new Uint8Array(this.frequencyCap);
};
AudioMather.prototype.getFrequencyDomain = function(){
	this.analyser.getByteFrequencyData(this.frequencyDomain);
	return this.frequencyDomain;
};
AudioMather.prototype.getTimeDomain = function(){
	this.analyser.getByteTimeDomainData(this.timeDomain);
	return this.timeDomain;
};