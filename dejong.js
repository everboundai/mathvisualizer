export default class DeJongVisualization {
    constructor(p, controlsElement) {
        this.p = p;
        this.controls = controlsElement;
        console.log("DeJongVisualization constructor called.");

        // Default parameters for reset
        this.defaultA = 1.4;
        this.defaultB = -2.3;
        this.defaultC = 2.4;
        this.defaultD = -2.1;
        this.defaultNumPoints = 10000;
        this.defaultSkipPoints = 1000;

        // Grab control elements
        this.sliderA = p.select('#dejongA', this.controls?.elt);
        this.valA    = p.select('#dejongAVal', this.controls?.elt);
        this.sliderB = p.select('#dejongB', this.controls?.elt);
        this.valB    = p.select('#dejongBVal', this.controls?.elt);
        this.sliderC = p.select('#dejongC', this.controls?.elt);
        this.valC    = p.select('#dejongCVal', this.controls?.elt);
        this.sliderD = p.select('#dejongD', this.controls?.elt);
        this.valD    = p.select('#dejongDVal', this.controls?.elt);
        this.sliderPoints = p.select('#dejongPoints', this.controls?.elt);
        this.valPoints    = p.select('#dejongPointsVal', this.controls?.elt);
        this.resetBtn     = p.select('#resetDeJongBtn', this.controls?.elt);

        // Initialize state from sliders (or defaults)
        this.a         = this.sliderA      ? parseFloat(this.sliderA.value())      : this.defaultA;
        this.b         = this.sliderB      ? parseFloat(this.sliderB.value())      : this.defaultB;
        this.c         = this.sliderC      ? parseFloat(this.sliderC.value())      : this.defaultC;
        this.d         = this.sliderD      ? parseFloat(this.sliderD.value())      : this.defaultD;
        this.numPoints = this.sliderPoints ? parseInt(this.sliderPoints.value())      : this.defaultNumPoints;
        this.skipPoints = this.defaultSkipPoints;

        this.points = [];
        this.bounds = { minX: 0, maxX: 0, minY: 0, maxY: 0 };
        this.scaleFactor = 1;
        this.buffer = null;
        this.needsRecalculation = true;

        // Attach listeners
        this.addListener(this.sliderA, 'input', this.updateParams);
        this.addListener(this.sliderB, 'input', this.updateParams);
        this.addListener(this.sliderC, 'input', this.updateParams);
        this.addListener(this.sliderD, 'input', this.updateParams);
        this.addListener(this.sliderPoints, 'input', this.updateParams);
        if (this.resetBtn) {
            this.resetBtn.mousePressed(() => this.resetDefaults());
        }

        // Create offscreen buffer
        this.buffer = p.createGraphics(p.width, p.height);
        this.buffer.colorMode(p.HSB, 360, 100, 100, 1);

        // Sync UI
        this.updateControlsFromState();
    }

    addListener(element, eventType, handler) {
        if (element) {
            element[eventType](() => handler.call(this));
        }
    }

    updateControlsFromState() {
        if (this.sliderA)      this.sliderA.value(this.a);
        if (this.sliderB)      this.sliderB.value(this.b);
        if (this.sliderC)      this.sliderC.value(this.c);
        if (this.sliderD)      this.sliderD.value(this.d);
        if (this.sliderPoints) this.sliderPoints.value(this.numPoints);

        if (this.valA)      this.valA.html(this.a.toFixed(3));
        if (this.valB)      this.valB.html(this.b.toFixed(3));
        if (this.valC)      this.valC.html(this.c.toFixed(3));
        if (this.valD)      this.valD.html(this.d.toFixed(3));
        if (this.valPoints) this.valPoints.html(this.numPoints);
    }

    updateParams() {
        let changed = false;
        let newA = this.sliderA      ? parseFloat(this.sliderA.value())      : this.a;
        let newB = this.sliderB      ? parseFloat(this.sliderB.value())      : this.b;
        let newC = this.sliderC      ? parseFloat(this.sliderC.value())      : this.c;
        let newD = this.sliderD      ? parseFloat(this.sliderD.value())      : this.d;
        let newNum = this.sliderPoints ? parseInt(this.sliderPoints.value())     : this.numPoints;

        if (newA !== this.a || newB !== this.b || newC !== this.c || newD !== this.d) {
            this.a = newA; this.b = newB; this.c = newC; this.d = newD;
            changed = true;
        }
        if (newNum !== this.numPoints) {
            this.numPoints = newNum;
            changed = true;
        }

        // Update labels
        if (this.valA)      this.valA.html(this.a.toFixed(3));
        if (this.valB)      this.valB.html(this.b.toFixed(3));
        if (this.valC)      this.valC.html(this.c.toFixed(3));
        if (this.valD)      this.valD.html(this.d.toFixed(3));
        if (this.valPoints) this.valPoints.html(this.numPoints);

        if (changed) {
            this.needsRecalculation = true;
            this.p.redraw();
        }
    }

    resetDefaults() {
        this.a = this.defaultA;
        this.b = this.defaultB;
        this.c = this.defaultC;
        this.d = this.defaultD;
        this.numPoints = this.defaultNumPoints;
        this.updateControlsFromState();
        this.needsRecalculation = true;
        this.p.redraw();
    }

    recalculate() {
        if (!this.needsRecalculation) return;
        console.log(`Recalculating De Jong for ${this.numPoints} points...`);
        const p = this.p;

        // Generate points
        let x = 0.1, y = 0.1;
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        this.points.length = 0;

        for (let i = 0; i < this.numPoints + this.skipPoints; i++) {
            const px = x, py = y;
            x = p.sin(this.a * py) - p.cos(this.b * px);
            y = p.sin(this.c * px) - p.cos(this.d * py);
            if (i >= this.skipPoints) {
                this.points.push([x, y]);
                minX = Math.min(minX, x);
                maxX = Math.max(maxX, x);
                minY = Math.min(minY, y);
                maxY = Math.max(maxY, y);
            }
        }

        // Handle degenerate
        if (minX === Infinity) { minX=-2; maxX=2; minY=-2; maxY=2; }
        else {
            if (maxX === minX) maxX += 1e-6;
            if (maxY === minY) maxY += 1e-6;
        }
        this.bounds = { minX, maxX, minY, maxY };

        // Dynamic scaling
        const pad = 0.90;
        const rangeX = maxX - minX;
        const rangeY = maxY - minY;
        const safeX = rangeX || 1e-6;
        const safeY = rangeY || 1e-6;
        const scaleX = p.width  * pad / safeX;
        const scaleY = p.height * pad / safeY;
        this.scaleFactor = Math.min(scaleX, scaleY);

        // Draw into buffer
        if (!this.buffer || this.buffer.width !== p.width || this.buffer.height !== p.height) {
            this.buffer = p.createGraphics(p.width, p.height);
            this.buffer.colorMode(p.HSB, 360, 100, 100, 1);
        }
        this.buffer.clear();
        this.buffer.push();
        const cx = (minX + maxX) / 2;
        const cy = (minY + maxY) / 2;
        this.buffer.translate(this.buffer.width/2, this.buffer.height/2);
        this.buffer.scale(this.scaleFactor);
        this.buffer.translate(-cx, -cy);
        this.buffer.strokeWeight(2);

        for (let [px, py] of this.points) {
            const hue = p.map(px, minX, maxX, 180, 360) + (p.frameCount * 0.1);
            const bright = p.map(py, minY, maxY, 60, 100);
            this.buffer.stroke(hue % 360, 80, bright, 0.7);
            this.buffer.point(px, py);
        }
        this.buffer.pop();

        this.needsRecalculation = false;
    }

    draw(sharedState) {
        const p = this.p;
        if (this.needsRecalculation) this.recalculate();
        if (this.buffer) p.image(this.buffer, 0, 0);
    }

    getDisplayName() { return "De Jong Attractor"; }
    getFormula()     { return `x_n = sin(a·y_{n-1}) - cos(b·x_{n-1})<br/>y_n = sin(c·x_{n-1}) - cos(d·y_{n-1})`; }
    getExplanation() { return `<h3>De Jong Attractor</h3>`; }
    isAnimatable()   { return false; }

    activate() {
        this.updateControlsFromState();
        this.needsRecalculation = true;
        this.p.redraw();
    }
}