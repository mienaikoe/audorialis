function Basic(canvas, mather){
	this.canvas = canvas;
	this.ctx = canvas.getContext("2d");
	this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
	
	this.mather = mather;
	
	this.twopi = 2 * Math.PI;
	this.lastsum = 0;
	var cap=this.mather.frequencyCap/5;
	this.bluecap = cap;
	this.greencap = cap*2;
	this.sumcap = this.mather.frequencyCap*255;
}

Basic.prototype.frame = function(timestamp){	
	var blue=0,green=0,red=0;
	var freqDomain = this.mather.getFrequencyDomain();
	for(var i=0; i<freqDomain.length; i++) { 
		if(i < this.bluecap){blue += freqDomain[i];} 
		else if( i < this.greencap){green += freqDomain[i];} 
		else {red += freqDomain[i];}
    } 
	var sum = blue+green+red;
	var avgsum = (sum+this.lastsum)/2;
	
	var max=128, min=128;
	var timeDomain = this.mather.getTimeDomain();
	for( var i=0; i<timeDomain.length; i++){
		var timeDom = timeDomain[i];
		if(timeDom > max){ max = timeDom; } 
		else if(timeDom < min){ min = timeDom; }
	}
		
	//this.ctx.clearRect(0,0,window.innerWidth, window.innerHeight );	
	this.ctx.rotate(0.01);
	
	var radius = (max-min)/4;
	this.circle(-this.canvas.width/3, -this.canvas.height/4, radius, this.rgba(red,max,200,avgsum));
	this.circle(this.canvas.width/4, -this.canvas.height/5, radius, this.rgba(200,green,max,avgsum));
	this.circle(0, this.canvas.height/4.5, radius, this.rgba(max,200,blue,avgsum));
	
	this.lastsum = sum;
};

Basic.prototype.rgba = function(red, green, blue, sum){
	return "rgba("+ (Math.floor((red/sum)*255)) +","+ (Math.floor((green/sum)*255)) +","+ (Math.floor((blue/sum)*255)) +",1)";
};

Basic.prototype.circle = function(x, y, radius, rgbaValue){
	this.ctx.beginPath();
	this.ctx.fillStyle = rgbaValue;
	this.ctx.arc(x, y, radius, 0, this.twopi, true);
	this.ctx.closePath();
	this.ctx.fill();
};