class canvasController {
	constructor(canvasId, statusLabelId, zoomInButtonId, zoomOutButtonId, iterInputId, downloadButtonId) {
		var canvas = document.getElementById(canvasId);
		this.wrapper = new canvasWrapper(canvas);
		this.statusLabel = document.getElementById(statusLabelId);

		var self = this

		canvas.onmousedown = function(e) { 
			self.dragStart(e); 
		}

		canvas.onmouseup = function () {
			self.dragEnd(); 
		}

		canvas.onmousemove = function(e) {
			self.drag(e);
			self.updateStatus(e);
		}

		document.getElementById(downloadButtonId).onclick = function() {
			var link = document.createElement('a');
			link.download = 'image.png';
			link.href = self.wrapper.canvas.toDataURL()
			link.click();
		}

		document.getElementById(zoomInButtonId).onclick = function() {
			self.wrapper.zoom *= ZOOM_FACTOR;
			self.wrapper.update()
		}
		
		document.getElementById(zoomOutButtonId).onclick = function() {
			self.wrapper.zoom /= ZOOM_FACTOR;
			self.wrapper.update()
		}
		
		document.getElementById(iterInputId).onchange = function(e) {
			self.wrapper.nIter = e.target.value;
			self.wrapper.update();
		}
	}

	registerJulia(jc) {
		var self = this;
		this.wrapper.canvas.ondblclick = () => { self.pinned = true; }
		this.wrapper.canvas.addEventListener("mousemove", function(e) {
			if (!self.pinned) {
				var rect = self.wrapper.canvas.getBoundingClientRect(),
					x = e.clientX - rect.left,
					y = e.clientY - rect.top,
				    z0 = self.wrapper.displayToComplex(x, y);
				jc.wrapper.getIterateParameters = (z) => ({z0 : z, c : z0});
				jc.wrapper.update();
			}
		});
	}

	dragStart(e) {
		if (e.target === this.wrapper.canvas) {
			this.dragging = true;
			this.pinned = true;
			this.initialX = e.clientX;
			this.initialY = e.clientY;
			this.image = this.wrapper.context.getImageData(0, 0, this.wrapper.canvas.width, this.wrapper.canvas.height);
		}
	}

	dragEnd() {
		this.wrapper.canvas.style.cursor = "crosshair";
		this.wrapper.translate(this.lastOffset.x, this.lastOffset.y);
		this.lastOffset = {x: 0, y: 0};
		this.wrapper.update();
		this.pinned = false;
		this.dragging = false;
	}

	drag(e) {
		if (this.dragging) {
			e.preventDefault();
			this.lastOffset = {
				x : e.clientX - this.initialX,
				y : e.clientY - this.initialY
			};

			this.wrapper.canvas.style.cursor = "move";
			this.wrapper.context.clearRect(0, 0, this.wrapper.canvas.width, this.wrapper.canvas.height);
			this.wrapper.context.putImageData(this.image, this.lastOffset.x, this.lastOffset.y);
		}
	}

	updateStatus(e) {
		var rect = this.wrapper.canvas.getBoundingClientRect(),
			x = e.clientX - rect.left,
			y = e.clientY - rect.top,
			z = this.wrapper.displayToComplex(x, y),
			str = "z = " + (z.re>0? "" : "  -") + Math.abs(z.re) + (z.im>0? " + " : " - ") + Math.abs(z.im) + "i";
		this.statusLabel.innerHTML = str;
	}
}


class canvasWrapper {
	constructor(canvas) {
		this.canvas = canvas;
		this.context = canvas.getContext('2d');
		this.pan = {x: 0, y: 0};
		this.zoom = DEFAULT_ZOOM;
		this.active = false;
		this.nIter = 100;
		this.getIterateParameters = (z) => ({z0 : new Complex(0, 0), c : z});
		this.update();
	}

	displayToComplex(x, y) {
		var w = this.canvas.width,
		    h = this.canvas.height;
		return new Complex( (x - 0.5*w) / this.zoom + this.pan.x, (y - 0.5*h) / this.zoom + this.pan.y);
	}

	translate(dx, dy) {
		this.pan.x -= dx / this.zoom;
		this.pan.y -= dy / this.zoom;
	}

	update() {
		var	row = this.context.createImageData(this.canvas.width, 1);
		for (var y = 0; y < this.canvas.height; ++y) {
			var offset = 0;
			for (var x = 0; x < this.canvas.width; ++x) {
				var z = this.displayToComplex(x, y),
					params = this.getIterateParameters(z),
					fun = (z) => FUN(z, params.c),
					con = (z) => (z.normSquared() < 4),
					res = iterate(this.nIter, params.z0, fun, con),
					rgb = getRGBColorFromIteration(res.n, this.nIter, res.z.norm());
				row.data[offset++] = rgb.r;
				row.data[offset++] = rgb.g;
				row.data[offset++] = rgb.b;
				row.data[offset++] = 255;	
			}
			this.context.putImageData(row, 0, y)
		}
	} 
}

class Complex {
	constructor(re, im) { this.re = re; this.im = im; }
	normSquared() { return this.re*this.re + this.im*this.im; }
	norm() { return Math.sqrt(this.normSquared()); }
}

// Sinking ship (> Mandelbrot ;) )
function g(z, c) {
	z.re = Math.abs(z.re);
	z.im = Math.abs(z.im);
	var re = z.re*z.re - z.im*z.im + c.re,
		im = 2*z.re*z.im + c.im;
	return new Complex(re, im)
}

// f (z, c) = z^2 + c
function f(z, c) {
	var re = z.re*z.re - z.im*z.im + c.re,
	    im = 2*z.re*z.im + c.im;
	return new Complex(re, im);
}

function iterate(nmax, z0, fun, cond) {
	nmax = Math.round(nmax);
	var i = 0,
		z = z0;
	while (++i < nmax && cond(z)) 
		z = fun(z);
	return {
		n: i,
		z: z
	}; 
}

function getRGBColorFromIteration(nIter, maxIter, lastNorm) {
	//var smoothIter = 5 + nIter - LOG_HALFBASE - Math.log(Math.log(lastNorm))*LOG_BASE;
	var smoothIter = nIter - Math.log2(Math.log2(lastNorm)) + 4.0
	if (nIter == maxIter) return {r: 0, g: 0, b: 0};
	var v1 = Math.floor(512.0*smoothIter/maxIter);
	if (v1 > 255) v1 = 255;
	return {
		r: v1,
		g: Math.floor(200.0*smoothIter/maxIter),
		b: v1
	};
}

/////////////////////////////////////////////

const DEFAULT_ZOOM = 250,
	  ZOOM_FACTOR = 1.3,
	  LOG_BASE = 1.0 / Math.log(2.0),
	  LOG_HALFBASE = Math.log(0.5)*LOG_BASE,
	  FUN = f;

mandeController = new canvasController('canvasM', 'statusM', 'zoomInM', 'zoomOutM', 'maxIterM', 'downloadM');
juliaController = new canvasController('canvasJ', 'statusJ', 'zoomInJ', 'zoomOutJ', 'maxIterJ', 'downloadJ');
mandeController.registerJulia(juliaController);
mandeController.wrapper.translate(2, 0)
