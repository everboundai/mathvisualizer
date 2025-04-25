// henon.js
export default class HenonVisualization {
  constructor(p, controlsElement) {
    this.p = p;
    this.controls = controlsElement;

    // defaults
    this.defaultA = 1.4;
    this.defaultB = 0.3;
    this.defaultNumPoints = 10000;

    // grab sliders & labels
    this.sliderA      = p.select('#henonA',      this.controls?.elt);
    this.valA         = p.select('#henonAVal',   this.controls?.elt);
    this.sliderB      = p.select('#henonB',      this.controls?.elt);
    this.valB         = p.select('#henonBVal',   this.controls?.elt);
    this.sliderPoints = p.select('#henonPoints', this.controls?.elt);
    this.valPoints    = p.select('#henonPointsVal', this.controls?.elt);

    // init parameters
    this.a = this.defaultA;
    this.b = this.defaultB;
    this.numPoints = this.defaultNumPoints;

    // offscreen buffer
    this.buffer = p.createGraphics(p.width, p.height);
    this.buffer.colorMode(p.HSB, 360,100,100,1);

    // wire up listeners
    this.addListener(this.sliderA,      'input', this.updateParams);
    this.addListener(this.sliderB,      'input', this.updateParams);
    this.addListener(this.sliderPoints, 'input', this.updateParams);

    // first sync/UI draw
    this.updateParams();
  }

  addListener(elem, ev, fn) {
    if (!elem) return;
    elem[ev](() => fn.call(this));
  }

  updateParams() {
    this.a = parseFloat(this.sliderA.value());
    this.b = parseFloat(this.sliderB.value());
    this.numPoints = parseInt(this.sliderPoints.value(),10);

    this.valA.html(this.a.toFixed(3));
    this.valB.html(this.b.toFixed(3));
    this.valPoints.html(this.numPoints);

    this.needsRecalc = true;
    this.p.redraw();
  }

  recalc() {
    if (!this.needsRecalc) return;
    const p = this.p;
    let x = 0, y = 0;
    const pts = [];
    let minX=Infinity, maxX=-Infinity, minY=Infinity, maxY=-Infinity;

    // generate Henon points
    for (let i=0; i<this.numPoints; i++) {
      const nx = 1 - this.a*x*x + y;
      const ny = this.b*x;
      x = nx; y = ny;
      pts.push([x,y]);
      minX = Math.min(minX,x);
      maxX = Math.max(maxX,x);
      minY = Math.min(minY,y);
      maxY = Math.max(maxY,y);
    }

    // scale to buffer
    const pad = 0.9,
          rangeX = maxX-minX||1,
          rangeY = maxY-minY||1,
          scaleF = Math.min(p.width*pad/rangeX, p.height*pad/rangeY);

    this.buffer.clear();
    this.buffer.push();
    this.buffer.translate(p.width/2, p.height/2);
    this.buffer.scale(scaleF);
    this.buffer.translate(-(minX+maxX)/2, -(minY+maxY)/2);
    this.buffer.strokeWeight(1);

    // draw points
    for (let [px,py] of pts) {
      this.buffer.stroke(
        (p.map(px,minX,maxX,0,360) + p.frameCount*0.1)%360,
        80,80,0.6
      );
      this.buffer.point(px,py);
    }
    this.buffer.pop();

    this.needsRecalc = false;
  }

  draw() {
    if (this.needsRecalc) this.recalc();
    this.p.image(this.buffer,0,0);
  }

  getDisplayName() { return 'Henon Map'; }
  getFormula()     { return 'xⁿ⁺¹ = 1 - a·xₙ² + yₙ<br>yⁿ⁺¹ = b·xₙ'; }
  getExplanation() {
    return `<h3>Henon Map</h3><p>A simple 2D chaotic map with two parameters <code>a</code> and <code>b</code>.</p>`;
  }
  isAnimatable() { return true; }

  activate() {
    // ensure a redraw when you switch back to it
    this.needsRecalc = true;
    this.p.redraw();
  }
}