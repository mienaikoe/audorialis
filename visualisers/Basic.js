function Basic(container, mather){
	this.container = container;
	this.mather = mather;
}

Basic.prototype.frame = function(timestamp){
	this.container.innerHTML = timestamp + "<br>" + this.mather.getTimeDomain()[0];
};