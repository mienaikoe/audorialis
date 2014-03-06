function Basic(canvas, mather){
	this.canvas = canvas;
	this.ctx = canvas.getContext("2d");
	this.resize();
	
	this.mather = mather;
	
	this.twopi = 2 * Math.PI;
	var cap=this.mather.frequencyCap/24;
	this.bluecap = cap*5;
	this.greencap = cap*11;
	this.sumcap = this.mather.frequencyCap*255;
	this.maxRadius = 800;
}

Basic.prototype.resize = function(){
	this.ctx.clearRect(0,0,window.innerWidth, window.innerHeight );
	this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);	
};


Basic.COLOR_THEMES = {
	fire: [
		[255,250,0],
		[235,120,0],
		[200,0,0]
	],
	ultraviolet: [
		[180,30,255],
		[100,20,255],
		[50,10,255]
	]
};


Basic.prototype.frame = function(timestamp){	
	var blue=0,green=0,red=0;
	var freqDomain = this.mather.getFrequencyDomain();
	for(var i=0; i<freqDomain.length; i++) { 
		if(i < this.bluecap){blue += freqDomain[i];} 
		else if( i < this.greencap){green += freqDomain[i];} 
		else {red += freqDomain[i];}
    } 
	var sum = Math.max(blue+green+red, 255);
	
	var max=128, min=128;
	var timeDomain = this.mather.getTimeDomain();
	for( var i=0; i<timeDomain.length; i++){
		var timeDom = timeDomain[i];
		if(timeDom > max){ max = timeDom; } 
		else if(timeDom < min){ min = timeDom; }
	}
		
	//this.ctx.clearRect(0,0,window.innerWidth, window.innerHeight );	
	this.ctx.rotate(0.003);
	
	
	var radmult = (this.maxRadius/(this.sumcap));
	var sixrad = blue*radmult;
	var tenrad = green*radmult;
	var forrad = red*radmult;
	var alpha = Math.max( ((max-min))/255, 0.1 );
	
	var theme = Basic.COLOR_THEMES.ultraviolet;
	this.line(0,0,this.maxRadius, "#000000");
	this.line(0, -this.canvas.height*0.06,	1+forrad, this.rgba(theme[0][0],theme[0][1],theme[0][2],alpha));
	this.line(0, -this.canvas.height*0.24,	1+tenrad, this.rgba(theme[1][0],theme[1][1],theme[2][2],alpha));
	this.line(0, -this.canvas.height*0.48,	1+sixrad, this.rgba(theme[2][0],theme[2][1],theme[1][2],alpha));
	
	
	this.lastsum = sum;
};

Basic.prototype.rgba = function(red, green, blue, alpha){
	return "rgba("+ 
			red +","+
			green +","+ 
			blue +","+
			alpha+")";
};

Basic.prototype.circle = function(x, y, radius, rgbaValue){
	this.ctx.beginPath();
	this.ctx.fillStyle = rgbaValue;
	this.ctx.arc(x, y, radius, 0, this.twopi, true);
	this.ctx.closePath();
	this.ctx.fill();
};

Basic.prototype.line = function(x, y, height, rgbaValue){
	//this.ctx.fillStyle = rgbaValue;
	this.ctx.strokeStyle = rgbaValue;
	var xy = x+y;
	this.ctx.beginPath();
	this.ctx.moveTo(x,y);
	this.ctx.lineTo(x-(height*(x/xy)), y-(height*(y/xy)));
	this.ctx.stroke();
	this.ctx.closePath();
	//this.ctx.fillRect(x,y,1,height);
};