function Basic(container, mather){
	this.container = container;
	this.mather = mather;
	
	var cap=this.mather.frequencyCap/5;
	this.bluecap = cap;
	this.greencap = cap*2;
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
	
	var max=128, min=128;
	var timeDomain = this.mather.getTimeDomain();
	for( var i=0; i<timeDomain.length; i++){
		var timeDom = timeDomain[i];
		if(timeDom > max){ max = timeDom; } 
		else if(timeDom < min){ min = timeDom; }
	}
	
	this.container.style.backgroundColor = this.rgba(red, green, blue, sum, max, min);
};

Basic.prototype.rgba = function(red, green, blue, sum, max, min){
	return "rgba("+ Math.floor((red/sum)*255) +","+ Math.floor((green/sum)*255) +","+ Math.floor(blue/sum)*255 +","+ ((max-min)/256) +")";
};