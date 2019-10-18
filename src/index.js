class Complex {
	constructor(re, im) { this.re = re; this.im = im; }
	normSquared() { return this.re*this.re + this.im*this.im; }
	norm() { return Math.sqrt(this.normSquared()); }
}


var zoomM = 250,
zoomJ = 250,
zoomFactor = 1.3,
panXM = -0.8,
panYM = 0,
panXJ = 0,
panYJ = 0,
maxIterM = document.getElementById('maxIterM').value,
maxIterJ = document.getElementById('maxIterJ').value,
JuliaListening = true,
canvasM = document.getElementById('canvasM'),
contextM = canvasM.getContext('2d'),
imageM,

canvasJ = document.getElementById('canvasJ'),
contextJ = canvasJ.getContext('2d'),
imageJ,

logBase = 1.0 / Math.log(2.0),
logHalfBase = Math.log(0.5)*logBase,
interiorColor = [0, 0, 0, 255],
lastZ;


function displayToComplexM(x, y, ){
	return new Complex((x - canvasM.width/2.0)/zoomM + panXM, -(canvasM.height/2.0 - y)/zoomM + panYM);
}
function displayToComplexJ(x, y){
	return new Complex((x - canvasJ.width/2.0)/zoomJ + panXJ, -(canvasJ.height/2.0 - y)/zoomJ + panYJ);
}

function abs(a) {  if (a < 0) return -a; else return a; }

function g(z, c, r){
	z.re = abs(z.re);
	z.im = abs(z.im);
	var re = z.re*z.re - z.im*z.im + c.re;
	r.im = 2*z.re*z.im + c.im;
	r.re = re;
}

function f(z, c, r){
	var re = z.re*z.re - z.im*z.im + c.re;
	r.im = 2*z.re*z.im + c.im;
	r.re = re;
}

function computeMandelbrot(){
	var	row = contextM.createImageData(canvasM.width, 1),
		offset,
		z, res,
		rgb;
	for (var y = 0; y < canvasM.height; ++y){
		offset = 0;
		for (var x = 0; x < canvasM.width; ++x) {
			z = displayToComplexM(x, y);
			rgb = getRGBColor(iterate(maxIterM, 2, z));
			row.data[offset++] = rgb.r;
			row.data[offset++] = rgb.g;
			row.data[offset++] = rgb.b;
			row.data[offset++] = 255;	
		}
		contextM.putImageData(row, 0, y)
	}
	//drawAxis();
}

function computeJulia(c){
	lastZ = c;
	var	row = contextJ.createImageData(canvasJ.width, 1),
		offset,
		z0, res,
		maxIter = 100,
		rgb;
	for (var y = 0; y < canvasJ.height; ++y){
		offset = 0;
		for (var x = 0; x < canvasJ.width; ++x) {
			z0 = displayToComplexJ(x, y);
			res = iterate(maxIterJ, 2, c, z0)
			rgb = getRGBColor(res);
			row.data[offset++] = rgb.r;
			row.data[offset++] = rgb.g;
			row.data[offset++] = rgb.b;
			row.data[offset++] = 255;	
		}
		contextJ.putImageData(row, 0, y)
	}
}


function iterate(maxIterat, radius, c, z0){
	if(z0 == null) z = new Complex(0,0);
	maxIterat = Math.round(maxIterat);
	var i = 0;
		z = z0 != null? z0 : new Complex(0,0),
		radiusSquared = radius*radius;
	while(i < maxIterat && z.normSquared() < radiusSquared) {
		f(z, c, z);
		++i;
		//smoothColor += Math.exp(-z.norm());
	}
	return {
		nIter: i,
		maxIter: maxIterat,
		nNorm: z.norm(),
	}; 
}


function getRGBColor(e){
	var nIter = e.nIter,
		maxIter = e.maxIter,
		nNorm = e.nNorm;
		//smoothIter = 5 + nIter - logHalfBase - Math.log(Math.log(nNorm))*logBase;
		smoothIter = nIter - Math.log2(Math.log2(nNorm)) + 4.0
		if (nIter == maxIter) return interiorColor;
		var v1 = Math.floor(512.0*smoothIter/maxIter);
		if (v1 > 255) v1 = 255;
		return {
			r: v1,
			g: Math.floor(200.0*smoothIter/maxIter),
			b: v1
		};
}


var activeM,
activeJ,
initialX,
initialY;

var currentX;
var currentY;
var initialX;
var initialY;
var xOffset = 0;
var yOffset = 0;


document.getElementById('zoomInM').onclick = function() {
	zoomM *= zoomFactor;
	computeMandelbrot();
}
document.getElementById('zoomOutM').onclick = function() {
	zoomM /= zoomFactor;
	computeMandelbrot();
}
document.getElementById('maxIterM').onchange = function() {
	maxIterM = document.getElementById('maxIterM').value;
	computeMandelbrot();
}
document.getElementById('zoomInJ').onclick = function() {
	zoomJ *= zoomFactor;
	computeJulia(lastZ);
}
document.getElementById('zoomOutJ').onclick = function() {
	zoomJ /= zoomFactor;
	computeJulia(lastZ);
}
document.getElementById('maxIterJ').onchange = function() {
	maxIterJ = document.getElementById('maxIterJ').value;
	computeJulia(lastZ);
}
document.getElementById('downloadM').onclick = function() {
	var link = document.createElement('a');
	link.download = 'mandelbrot.png';
	link.href = document.getElementById('canvasM').toDataURL()
	link.click();
}
document.getElementById('downloadJ').onclick = function() {
	var link = document.createElement('a');
	link.download = 'julia.png';
	link.href = document.getElementById('canvasJ').toDataURL()
	link.click();
}
canvasM.addEventListener("touchstart", dragStart);
canvasM.addEventListener("touchend", dragEnd);
canvasM.addEventListener("touchmove", drag);

canvasM.addEventListener("mousedown", dragStart);
canvasM.addEventListener("mouseup", dragEnd);
canvasM.addEventListener("mousemove", drag);
canvasM.addEventListener("mousemove", computeStatusM);
canvasM.onload = computeMandelbrot();
canvasM.addEventListener ("mouseout", function() { JuliaListening = true; });


canvasJ.addEventListener("touchstart", dragStart);
canvasJ.addEventListener("touchend", dragEnd);
canvasJ.addEventListener("touchmove", drag);

canvasJ.addEventListener("mousedown", dragStart);
canvasJ.addEventListener("mouseup", dragEnd);
canvasJ.addEventListener("mousemove", drag);
canvasJ.addEventListener("mousemove", computeStatusJ);


function dragStart(e) {
	if (e.type === "touchstart") {
		initialX = e.touches[0].clientX - xOffset;
		initialY = e.touches[0].clientY - yOffset;
	} else {
		initialX = e.clientX - xOffset;
		initialY = e.clientY - yOffset;
	}
	if (e.target === canvasM) {
		activeM = true;
		JuliaListening = !JuliaListening;
		imageM = contextM.getImageData(0, 0, canvasM.width, canvasM.height);
	}
	else if (e.target == canvasJ) {
		activeJ = true;
		imageJ = contextJ.getImageData(0, 0, canvasJ.width, canvasJ.height);
	}
}

function dragEnd(e) {
	initialX = currentX;
	initialY = currentY;
	if(activeM){
		document.getElementById("canvasM").style.cursor = "crosshair";
		panXM -= xOffset/zoomM;
		panYM -= yOffset/zoomM;
		activeM = false;
		computeMandelbrot();
	}
	else if(activeJ){
		document.getElementById("canvasJ").style.cursor = "crosshair";
		panXJ -= xOffset/zoomJ;
		panYJ -= yOffset/zoomJ;
		activeJ = false;
		computeJulia(lastZ);
	}
	xOffset = 0;
	yOffset = 0;
}

function drag(e) {
	if (activeM || activeJ ) {

		e.preventDefault();

		if (e.type === "touchmove") {
			currentX = e.touches[0].clientX - initialX;
			currentY = e.touches[0].clientY - initialY;
		} else {
			currentX = e.clientX - initialX;
			currentY = e.clientY - initialY;
		}

		xOffset = currentX;
		yOffset = currentY;
		if(activeM) {
			document.getElementById("canvasM").style.cursor = "move";
			contextM.clearRect(0, 0, canvasM.width, canvasM.height);
			contextM.putImageData(imageM, xOffset, yOffset);
		}
		else if(activeJ) {
			document.getElementById("canvasJ").style.cursor = "move";
			contextJ.clearRect(0, 0, canvasJ.width, canvasJ.height);
			contextJ.putImageData(imageJ, xOffset, yOffset);
		}
	}
}

function HSVtoRGB(h, s, v) {
	var r, g, b, i, f, p, q, t;
	if (arguments.length === 1) {
	    s = h.s, v = h.v, h = h.h;
	}
	i = Math.floor(h * 6);
	f = h * 6 - i;
	p = v * (1 - s);
	q = v * (1 - f * s);
	t = v * (1 - (1 - f) * s);
	switch (i % 6) {
	    case 0: r = v, g = t, b = p; break;
	    case 1: r = q, g = v, b = p; break;
	    case 2: r = p, g = v, b = t; break;
	    case 3: r = p, g = q, b = v; break;
	    case 4: r = t, g = p, b = v; break;
	    case 5: r = v, g = p, b = q; break;
	}
	return {
	    r: Math.round(r * 255),
	    g: Math.round(g * 255),
	    b: Math.round(b * 255)
	};
}

function computeStatusM(e){
	if(activeM) return;
	var rect = canvasM.getBoundingClientRect();
		x = e.clientX - rect.left;
		y = e.clientY - rect.top;
		z = displayToComplexM(x, y);
		str = /*"[nIter, maxIter, nNorm] = [" + e.nIter + ", " + e.maxIter + ", " + e.nNorm + "] */
		"z = " + (z.re>0? "" : "  -") + Math.abs(z.re) + (z.im>0? " + " : " - ") + Math.abs(z.im) + "i";
	document.getElementById("statusM").innerHTML = str;
	if(JuliaListening) computeJulia(z);
}

function computeStatusJ(e){
	if(activeJ) return;
	var rect = canvasJ.getBoundingClientRect();
		x = e.clientX - rect.left;
		y = e.clientY - rect.top;
		z = displayToComplexJ(x, y);
		str = /*"[nIter, maxIter, nNorm] = [" + e.nIter + ", " + e.maxIter + ", " + e.nNorm + "] */
		"z = " + (z.re>0? "" : "  -") + Math.abs(z.re) + (z.im>0? " + " : " - ") + Math.abs(z.im) + "i";
	document.getElementById("statusJ").innerHTML = str;
}