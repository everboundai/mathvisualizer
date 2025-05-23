export default class DeJongVisualization {
    constructor(p, controlsElement) {
        this.p = p;
        this.controls = controlsElement;
        console.log("DeJongVisualization constructor called.");

        // --- Updated defaults to a known-good De Jong parameter set ---
        this.defaultA = 1.641;
        this.defaultB = -1.902;
        this.defaultC = -1.916;
        this.defaultD = -1.483;
        this.defaultNumPoints = 50000;
        this.defaultSkipPoints = 1000;

        // Grab UI controls
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

        // Initialize state to defaults, then sync UI (so resetDefaults logic applies immediately)
        this.resetDefaults();

        // Prepare offscreen buffer for drawing
        this.buffer = p.createGraphics(p.width, p.height);
        this.buffer.colorMode(p.HSB, 360, 100, 100, 1);
    }

    addListener(element, eventType, handler) {
        if (element) element[eventType](() => handler.call(this));
    }

    updateControlsFromState() {
        // Slider positions
        if (this.sliderA)      this.sliderA.value(this.a);
        if (this.sliderB)      this.sliderB.value(this.b);
        if (this.sliderC)      this.sliderC.value(this.c);
        if (this.sliderD)      this.sliderD.value(this.d);
        if (this.sliderPoints) this.sliderPoints.value(this.numPoints);

        // Display spans
        if (this.valA)      this.valA.html(this.a.toFixed(3));
        if (this.valB)      this.valB.html(this.b.toFixed(3));
        if (this.valC)      this.valC.html(this.c.toFixed(3));
        if (this.valD)      this.valD.html(this.d.toFixed(3));
        if (this.valPoints) this.valPoints.html(this.numPoints);
    }

    updateParams() {
        let changed = false;
        const newA   = this.sliderA      ? parseFloat(this.sliderA.value())      : this.a;
        const newB   = this.sliderB      ? parseFloat(this.sliderB.value())      : this.b;
        const newC   = this.sliderC      ? parseFloat(this.sliderC.value())      : this.c;
        const newD   = this.sliderD      ? parseFloat(this.sliderD.value())      : this.d;
        const newNum = this.sliderPoints ? parseInt(this.sliderPoints.value())     : this.numPoints;

        if (newA !== this.a || newB !== this.b || newC !== this.c || newD !== this.d) {
            this.a = newA; this.b = newB; this.c = newC; this.d = newD;
            changed = true;
        }
        if (newNum !== this.numPoints) {
            this.numPoints = newNum;
            changed = true;
        }
        // Update spans
        this.updateControlsFromState();
        if (changed) {
            this.needsRecalculation = true;
            this.p.redraw();
        }
    }

    resetDefaults() {
        // Reset state to defaults
        this.a = this.defaultA;
        this.b = this.defaultB;
        this.c = this.defaultC;
        this.d = this.defaultD;
        this.numPoints = this.defaultNumPoints;

        // Sync UI and attach listeners once
        this.updateControlsFromState();
        this.addListener(this.sliderA, 'input', this.updateParams);
        this.addListener(this.sliderB, 'input', this.updateParams);
        this.addListener(this.sliderC, 'input', this.updateParams);
        this.addListener(this.sliderD, 'input', this.updateParams);
        this.addListener(this.sliderPoints, 'input', this.updateParams);
        if (this.resetBtn) this.resetBtn.mousePressed(() => this.resetDefaults());

        this.needsRecalculation = true;
        this.p.redraw();
    }

    recalculate() {
        if (!this.needsRecalculation) return;
        const p = this.p;

        let x = 0.1, y = 0.1;
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        this.points = [];

        for (let i = 0; i < this.numPoints + this.defaultSkipPoints; i++) {
            const px = x, py = y;
            x = p.sin(this.a * py) - p.cos(this.b * px);
            y = p.sin(this.c * px) - p.cos(this.d * py);
            if (i >= this.defaultSkipPoints) {
                this.points.push([x, y]);
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            }
        }
        // Fallback if no points
        if (minX === Infinity) { minX = -2; maxX = 2; minY = -2; maxY = 2; }

        this.bounds = { minX, maxX, minY, maxY };

        // Dynamic scale
        const pad = 0.90;
        const rangeX = maxX - minX || 1;
        const rangeY = maxY - minY || 1;
        const scaleX = p.width  * pad / rangeX;
        const scaleY = p.height * pad / rangeY;
        this.scaleFactor = Math.min(scaleX, scaleY);

        // Prepare buffer
        if (!this.buffer || this.buffer.width !== p.width || this.buffer.height !== p.height) {
            this.buffer = p.createGraphics(p.width, p.height);
            this.buffer.colorMode(p.HSB, 360, 100, 100, 1);
        }
        this.buffer.clear();
        this.buffer.push();
        const cx = (minX + maxX) / 2;
        const cy = (minY + maxY) / 2;
        this.buffer.translate(this.buffer.width / 2, this.buffer.height / 2);
        this.buffer.scale(this.scaleFactor);
        this.buffer.translate(-cx, -cy);
        this.buffer.strokeWeight(2);

        for (const [px, py] of this.points) {
            const hue = (p.map(px, minX, maxX, 180, 360) + p.frameCount * 0.1) % 360;
            const bright = p.map(py, minY, maxY, 60, 100);
            this.buffer.stroke(hue, 80, bright, 0.7);
            this.buffer.point(px, py);
        }
        this.buffer.pop();

        this.needsRecalculation = false;
    }

    draw(sharedState) {
        if (this.needsRecalculation) this.recalculate();
        if (this.buffer) this.p.image(this.buffer, 0, 0);
    }

    getDisplayName() { return "De Jong Attractor"; }
    getFormula()     { return `x_n = sin(a·y_{n-1}) - cos(b·x_{n-1})<br/>y_n = sin(c·x_{n-1}) - cos(d·y_{n-1})`; }
    getExplanation() { return `<h3>De Jong Attractor</h3><p>Adjust parameters to explore the attractor.</p>`; }
    isAnimatable()   { return false; }

    activate() {
        this.updateControlsFromState();
        this.needsRecalculation = true;
        this.p.redraw();
    }
}