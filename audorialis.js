var Audorialis = function(){
	this.acquireDomControls();
	this.instantiateAudioSystem();
	
	var playlist;
	if( window.localStorage ){
		playlist = window.localStorage.getItem("playlist");
	}
	if( playlist ){
		this.playlist = JSON.parse(playlist);
	} else {
		this.playlist = [
			{ 
				name: 'Seabound',
				url: 'music/Seabound.mp3',
				type: 'URL'
			}
		];
	}
	
	this.initPlaylist();
	
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
	this.playlistView = document.getElementById("playlist");
	
	var self = this;
	this.controls.play.onclick = function(){
		self.playpause();
	};
	this.controls.gain.onchange = function(){
		self.gain.gain.value = parseFloat(this.value);
	};
	this.controls.mute.onclick = function(){
		if( self.muted ){
			this.classList.remove("fa-volume-off");
			this.classList.add("fa-volume-up");
			self.controls.gain.value = self.unmuteLevel;
			self.muted = false;
		} else {
			this.classList.remove("fa-volume-up");
			this.classList.add("fa-volume-off");
			self.unmuteLevel = self.gain.gain.value;
			self.controls.gain.value = 0;
			self.muted = true;
		}
		self.controls.gain.onchange();
	};
	this.controls.file.onchange = function(){
		for( var i=0; i< (this.files || []).length; i++ ){
			var fileObj = this.files[i];
			var songObject = {
				file: fileObj,
				name: fileObj.name,
				path: fileObj.filename,
				type: 'FILE'
			};
			self.parseMusicSource(songObject, function(){
				self.playlist.push(songObject);
				window.localStorage.setItem("playlist",JSON.stringify(self.playlist));
			});
		}
	};
	
	var urlPop = document.getElementById("urlPop");
	urlPop.onclick = function(){ urlPop.style.display = 'none'; };
	document.getElementById("urlForm").onclick = function(ev){ ev.preventDefault(); ev.stopPropagation(); return false; };
	var urlInput = document.getElementById("urlInput");
	document.getElementById("urlSubmit").onclick = function(ev){ 
		var songObject = {
			url: urlInput.value,
			name: urlInput.value,
			type: 'URL'
		};
		self.fetchMusicSource(songObject, function(){
			self.playlist.push(songObject);
			window.localStorage.setItem("playlist",JSON.stringify(self.playlist));
		});
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
	this.gain = this.ctx.createGain();
	this.gain.gain.value = 0.5;
	
	this.audioMather = new AudioMather(this.analyser);
	
	this.musicSource.connect(this.analyser);
	this.audioMather.analyser.connect(this.gain);
	this.gain.connect(this.ctx.destination);
};



Audorialis.prototype.initPlaylist = function(){
	var self = this;
	for( var i in this.playlist ){
		var songObject = this.playlist[i];
		var callback;
		if( i === "0" ){
			callback = function(){ 
				self.playMusicSource(songObject);
			};
		}
		if( songObject.type === "URL" ){
			this.fetchMusicSource(songObject, callback);
		} else if( songObject.type === "FILE" ){
			this.parseMusicSource(songObject, callback);
		}
	}
};

Audorialis.prototype.fetchMusicSource = function( songObject, callback ){	
	var self = this;
	
	songObject.view = document.createElement("div");
	songObject.view.style.color = "#AAA";
	songObject.view.innerHTML = "Loading Song...";
	this.playlistView.appendChild(songObject.view);
	
    var request = new XMLHttpRequest();
    request.open("GET", songObject.url, true);
    request.responseType = "arraybuffer";
    request.onload = function() {
        self.ctx.decodeAudioData(
            request.response,
            function(buffer) {
				// Save as a FileSystem API File, and reference that file. Don't keep several Megs in memory
				songObject.buffer = buffer;
				songObject.view.innerHTML = songObject.url;
				songObject.view.style.color = "#CCC";
				songObject.view.onclick = function(){
					self.playMusicSource(songObject);
				};
				if( callback ){
					callback(songObject);
				}
            },
            function() { 
				alert(songObject.url+" Is Invalid. Please Try Again"); 
				songObject.view.innerHTML = "Could Not Load Song";
				songObject.view.style.color = "red";
			}
        );
    };
	
	try{
		request.send();
	} catch(err) { 
		alert(url+" Is Invalid. Please Try Again"); 
	}
};

Audorialis.prototype.parseMusicSource = function( songObject, callback ){
	var self = this;
	
	songObject.view = document.createElement("div");
	songObject.view.style.color = "#AAA";
	songObject.view.innerHTML = "Loading Song...";
	this.playlistView.appendChild(songObject.view);
	
	var file = songObject.file;
	
	var reader = new FileReader();
	reader.onload = function() { 
		self.ctx.decodeAudioData(
			this.result, 
			function(buffer){
				// Save as a FileSystem API File, and reference that file. Don't keep several Megs in memory
				songObject.buffer = buffer;
				songObject.view.style.color = "#CCC";
				songObject.view.innerHTML = file.name;
				songObject.view.onclick = function(){
					self.playMusicSource(songObject);
				};
				if( callback ){
					callback(songObject);
				}
			},
			function(){
				alert(file.name+" Is Invalid. Please Try Again");
				songObject.view.innerHTML = "Could Not Load Song";
				songObject.view.style.color = "red";
			});
	};
	
	try{
		reader.readAsArrayBuffer(file);
	} catch(err) { 
		alert(file+" Is Invalid. Please Try Again"); 
	}
    
};


Audorialis.prototype.playMusicSource = function( songObject ){
	if( this.currentSong ){
		this.currentSong.view.style.color = "#CCC";
	}
	this.currentSong = songObject;
	this.currentSong.view.style.color = "#FFF";
	
	this.pause();
	this.leftOff = 0;
	this.play();
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
	if( !this.currentSong || !this.currentSong.buffer ){
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
		 this.pause();
	 } else {
		 this.play();
	 }
};


Audorialis.prototype.pause = function(){
	if( this.playing ){
		this.leftOff = this.leftOff + (this.ctx.currentTime - this.startCtxTime);
		this.startCtxTime = null;
		
		this.musicSource.stop(0);
		this.musicSource.disconnect(0);
		this.musicSource = null;
		
		this.controls.play.classList.remove("fa-pause");
		this.controls.play.classList.add("fa-play");
		
		this.playing = false;
	}
};

Audorialis.prototype.play = function(){
	if( !this.playing ) {
		if( !this.readyToPlay() ){ return; }
		this.musicSource = this.ctx.createBufferSource();
		this.musicSource.buffer = this.currentSong.buffer;
		this.musicSource.connect(this.analyser);
		this.musicSource.start(0, this.leftOff);
		this.startCtxTime = this.ctx.currentTime;
	
		this.controls.play.classList.remove("fa-play");
		this.controls.play.classList.add("fa-pause");
		
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
