"use strict";
/*
 * Random discrete (maximum, offset)
 */
var randd = function(max, min) {
	min = min || 0;
	return ~~(Math.random() * (max - min) + min);
}

/*
 * Random uniform (maximum, offset)
 */
var randu = function(max, min) {
	min = min || 0;
	return (Math.random() * (max - min) + min);
}

/*
 * Random gauss (standard deviation, expectation value)
 */
var randg = function(sigma, mu) {
	var s, u, v;
	sigma = sigma === undefined ? 1 : sigma;
	mu = mu || 0;

	do
	{
		u = randu(1.0, -1.0);
		v = randu(1.0, -1.0);
		s = u * u + v * v;
	} while (s == 0.0 || s >= 1.0);

	return mu + sigma * u * Math.sqrt(-2.0 * Math.log(s) / s);
}

/*
 * Random exponential (decay rate, offset)
 */
var rande = function(decay, min) {
	min = min || 0.0;
	return min - Math.log(Math.random()) / decay;
}

/* 
 * Graphic loop
 */
window.nextAnimationFrame = (function() {
	return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function(callback) {
		window.setTimeout(callback, 1000 / 60);
	};
})();