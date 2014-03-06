
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
	
	var lastSong = localStorage.getItem("lastSong");
	if( lastSong ){
		this.fetchMusicSource(lastSong);
	} else {
		this.fetchMusicSource('music/Seabound.mp3');
	}
	
	this.setVisualiser('Basic');
};


Audorialis.prototype.acquireDomControls = function(){
	this.controls = {
		play: document.getElementById("play"),
		gain: document.getElementById("gain"),
		mute: document.getElementById("mute"),
		file: document.getElementById("file"),
		path: document.getElementById("path")
	};
	this.playlist = document.getElementById("playlist");
	
	var self = this;
	this.controls.play.onclick = function(){
		self.playpause();
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
		self.parseMusicSource(this);
	};
	
	var urlPop = document.getElementById("urlPop");
	urlPop.onclick = function(){ urlPop.style.display = 'none'; };
	document.getElementById("urlForm").onclick = function(ev){ ev.preventDefault(); ev.stopPropagation(); return false; };
	var urlInput = document.getElementById("urlInput");
	document.getElementById("urlSubmit").onclick = function(ev){ 
		self.fetchMusicSource(urlInput.value);
		urlPop.style.display = 'none';
	};
	this.controls.path.onclick = function(){
		urlPop.style.display = 'block';
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
				if( self.playing ){
					self.playpause();
				}
				self.leftOff = 0;
				localStorage.setItem("lastSong", url);
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

Audorialis.prototype.parseMusicSource = function( inputel ){
	var file = inputel.files[0];
	var self = this;
	var reader = new FileReader();
	reader.onload = function() { 
		self.ctx.decodeAudioData(
			this.result, 
			function(buffer){
				self.buffer = buffer;
				self.musicSource.buffer = buffer;
				self.playlist.innerHTML = "<div>"+file.name+"</div>";
				if( self.playing ){
					self.playpause();
				}
				self.leftOff = 0;
			},
			function(){
				alert(file.name+" Is Invalid. Please Try Again"); 
			});
	};
	
	try{
		reader.readAsArrayBuffer(file);
	} catch(err) { 
		alert(file+" Is Invalid. Please Try Again"); 
	}
    
};



Audorialis.prototype.setCanvas = function(){
	this.canvas = document.getElementById("canvas");
	this.resizeCanvas();
	window.addEventListener('resize', this.resizeCanvas.bind(this), false);
};

Audorialis.prototype.resizeCanvas = function(){
	this.canvas.width = window.innerWidth;
	this.canvas.height = window.innerHeight;
	if( this.visualiser ){
		this.visualiser.resize();
	}
};

Audorialis.prototype.setVisualiser = function(handle){
	if( !this.canvas ){
		this.setCanvas();
	}
	var visualiserConstructor = window[handle];
	if( !visualiserConstructor ){
		this.loadVisualiser(handle);
	} else {
		this.visualiser = new visualiserConstructor(this.canvas, this.audioMather);
		this.animating=true;
		this.frame(0);
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





Audorialis.prototype.playpause = function(){
	if( this.playing ){
		this.leftOff = this.leftOff + (this.ctx.currentTime - this.startCtxTime);
		this.startCtxTime = null;
		
		this.musicSource.stop(0);
		this.musicSource.disconnect(0);

		this.musicSource = this.ctx.createBufferSource();
		this.musicSource.buffer = this.buffer;
		this.musicSource.connect(this.analyser);
		
		this.playing = false;
	} else {
		if( !this.readyToPlay() ){ return; }
		this.musicSource.start(0, this.leftOff);
		this.startCtxTime = this.ctx.currentTime;
		
		this.playing = true;
	}
};

Audorialis.prototype.frame = function( timestamp ){
	if( !this.animating ){
		this.startTimestamp = null;
		return;
	}
	if( !this.startTimestamp ){
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
