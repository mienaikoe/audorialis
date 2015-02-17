function SongObject(source, options){
	this.url = source.url;
	this.file = source.file;
	this.path = source.path;
	this.type = source.type;
	this.name = source.name;

	this.view = document.createElement("div");
	this.view.style.color = "#AAA";
	this.view.innerHTML = this.name;
	SongObject.container.appendChild(this.view);
	
	var self = this;
	this.view.onclick = function(){
		self.run();
	};
};

SongObject.setup = function(options){
	SongObject.ctx = options.context;
	SongObject.player = options.player;
	SongObject.container = options.container;
};

SongObject.prototype = {
	run: function( ){
		if( this.type === "URL" ){
			this.fetchMusicSource( SongObject.player );
		} else if( this.type === "FILE" ){
			this.parseMusicSource( SongObject.player );
		}
	},
	marshal: function(){
		return {
			url: this.url,
			path: this.path,
			name: this.name,
			type: this.type
		};
	},
	fetchMusicSource: function( callback ){	
		var self = this;

		this.view.innerHTML += "%";

		var request = new XMLHttpRequest();
		request.open("GET", this.url, true);
		request.responseType = "arraybuffer";
		request.onload = function() {
			SongObject.ctx.decodeAudioData(
				request.response,
				function(buffer) {
					// Save as a FileSystem API File, and reference that file. Don't keep several Megs in memory
					self.buffer = buffer;
					self.name = self.url;
					self.view.innerHTML = self.name;
					self.view.style.color = "#CCC";
					if( callback ){
						callback(self);
					}
				},
				function() { 
					alert(self.url+" Is Invalid. Please Try Again"); 
					self.view.innerHTML = "Could Not Load Song";
					self.view.style.color = "red";
				}
			);
		};

		try{
			request.send();
		} catch(err) { 
			alert(url+" Is Invalid. Please Try Again"); 
		}
	},
	parseMusicSource: function( callback ){
		var self = this;

		this.view.innerHTML += "%";

		var file = this.file;

		var reader = new FileReader();
		reader.onload = function() { 
			SongObject.ctx.decodeAudioData(
				this.result, 
				function(buffer){
					// Save as a FileSystem API File, and reference that file. Don't keep several Megs in memory
					self.buffer = buffer;
					self.view.style.color = "#CCC";
					self.name = file.name;
					self.view.innerHTML = self.name;
					if( callback ){
						callback(self);
					}
				},
				function(){
					alert(file.name+" Is Invalid. Please Try Again");
					self.view.innerHTML = "Could Not Load Song";
					self.view.style.color = "red";
				});
		};

		try{
			reader.readAsArrayBuffer(file);
		} catch(err) { 
			alert(file+" Is Invalid. Please Try Again"); 
		}
	}
};
