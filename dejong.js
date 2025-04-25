// dejong.js - Module for Peter de Jong Attractor Visualization (New Defaults & Fixes)

export default class DeJongVisualization {
    constructor(p, controlsElement) {
        this.p = p;
        this.controls = controlsElement;
        console.log("DeJongVisualization constructor called.");

        // *** New Default parameters - Known to be more visually interesting ***
        this.defaultA = 1.4;
        this.defaultB = -2.3;
        this.defaultC = 2.4;
        this.defaultD = -2.1;
        // Keep reduced default points for now
        this.defaultNumPoints = 10000;
        this.defaultSkipPoints = 1000;

        // State
        this.a = this.defaultA; this.b = this.defaultB;
        this.c = this.defaultC; this.d = this.defaultD;
        this.numPoints = this.defaultNumPoints;
        this.skipPoints = this.defaultSkipPoints;

        this.points = [];
        this.needsRecalculation = true;
        this.bounds = { minX: 0, maxX: 0, minY: 0, maxY: 0 };
        this.scaleFactor = 1.0;
        this.buffer = null;

        // Get specific controls... (as before)
        this.sliderA = p.select('#dejongA', this.controls?.elt); this.valA = p.select('#dejongAVal', this.controls?.elt);
        this.sliderB = p.select('#dejongB', this.controls?.elt); this.valB = p.select('#dejongBVal', this.controls?.elt);
        this.sliderC = p.select('#dejongC', this.controls?.elt); this.valC = p.select('#dejongCVal', this.controls?.elt);
        this.sliderD = p.select('#dejongD', this.controls?.elt); this.valD = p.select('#dejongDVal', this.controls?.elt);
        this.sliderPoints = p.select('#dejongPoints', this.controls?.elt); this.valPoints = p.select('#dejongPointsVal', this.controls?.elt);
        this.resetBtn = p.select('#resetDeJongBtn', this.controls?.elt);

        // Attach listeners... (as before)
        this.addListener(this.sliderA, 'input', this.updateParams);
        this.addListener(this.sliderB, 'input', this.updateParams);
        this.addListener(this.sliderC, 'input', this.updateParams);
        this.addListener(this.sliderD, 'input', this.updateParams);
        this.addListener(this.sliderPoints, 'input', this.updateParams);
        if (this.resetBtn) { this.resetBtn.mousePressed(() => this.resetDefaults()); }

        // Create buffer immediately
        this.buffer = p.createGraphics(p.width, p.height);
        this.buffer.colorMode(p.HSB, 360, 100, 100, 1.0);

        // Initial setup
        this.updateControlsFromState(); // Set initial slider values etc. from defaults
        this.needsRecalculation = true; // Ensure first draw recalculates
    }

    addListener(element, eventType, handler) { /* ... as before ... */ }

    // Renamed for clarity
    updateControlsFromState() {
        console.log("Updating De Jong controls from state.");
        // Update sliders to match internal state
        if (this.sliderA) this.sliderA.value(this.a); if (this.sliderB) this.sliderB.value(this.b);
        if (this.sliderC) this.sliderC.value(this.c); if (this.sliderD) this.sliderD.value(this.d);
        if (this.sliderPoints) this.sliderPoints.value(this.numPoints);
        // Update display spans
        if (this.valA) this.valA.html(this.a.toFixed(3)); if (this.valB) this.valB.html(this.b.toFixed(3));
        if (this.valC) this.valC.html(this.c.toFixed(3)); if (this.valD) this.valD.html(this.d.toFixed(3));
        if (this.valPoints) this.valPoints.html(this.numPoints);
    }

    updateParams() {
        let changed = false; let pointsChanged = false;
        // Read parameters from sliders
        let newA = this.sliderA ? parseFloat(this.sliderA.value()) : this.a; let newB = this.sliderB ? parseFloat(this.sliderB.value()) : this.b;
        let newC = this.sliderC ? parseFloat(this.sliderC.value()) : this.c; let newD = this.sliderD ? parseFloat(this.sliderD.value()) : this.d;
        let newNumPoints = this.sliderPoints ? parseInt(this.sliderPoints.value()) : this.numPoints;

        // Check if changed vs internal state
        if (newA !== this.a || newB !== this.b || newC !== this.c || newD !== this.d) { this.a = newA; this.b = newB; this.c = newC; this.d = newD; changed = true; console.log("De Jong parameters changed."); }
        if (newNumPoints !== this.numPoints) { this.numPoints = newNumPoints; pointsChanged = true; console.log("De Jong numPoints changed."); }

        // Update display spans
        if (this.valA) this.valA.html(this.a.toFixed(3)); if (this.valB) this.valB.html(this.b.toFixed(3));
        if (this.valC) this.valC.html(this.c.toFixed(3)); if (this.valD) this.valD.html(this.d.toFixed(3));
        if (this.valPoints) this.valPoints.html(this.numPoints);

        // Trigger recalculation if needed
        if (changed || pointsChanged) { this.needsRecalculation = true; this.p.redraw(); }
    }

    resetDefaults() {
        console.log("Resetting De Jong parameters to defaults.");
        // Set internal state back to defaults
        this.a = this.defaultA; this.b = this.defaultB;
        this.c = this.defaultC; this.d = this.defaultD;
        this.numPoints = this.defaultNumPoints;

        // Update sliders and display values directly from state
        this.updateControlsFromState();

        // Flag for recalc and redraw
        this.needsRecalculation = true;
        this.p.redraw();
    }

    recalculate() { /* ... calculation logic as before (skip points, calc bounds, fixed scale) ... */
        if (!this.needsRecalculation) return;
        console.log(`Recalculating De Jong Attractor for ${this.numPoints} points (skipping first ${this.skipPoints})...`);
        const p = this.p; this.points = [];
        let x = 0, y = 0; let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        let firstPointBounded = false;
        for (let i = 0; i < this.numPoints + this.skipPoints; i++) {
            let prevX = x; let prevY = y;
            x = p.sin(this.a * prevY) - p.cos(this.b * prevX);
            y = p.sin(this.c * prevX) - p.cos(this.d * prevY);
            if (i >= this.skipPoints) {
                this.points.push([x, y]);
                if (!firstPointBounded) { minX = maxX = x; minY = maxY = y; firstPointBounded = true; }
                else { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
            }
        }
        if (!firstPointBounded) { minX = -2; maxX = 2; minY = -2; maxY = 2; } else { if (maxX === minX) maxX += 1e-6; if (maxY === minY) maxY += 1e-6; }
        this.bounds = { minX, maxX, minY, maxY }; console.log("Bounds calculated (after skip):", this.bounds);
        const padding = 0.90; const typicalRange = 4.5;
        this.scaleFactor = Math.min(p.width * padding / typicalRange, p.height * padding / typicalRange);
        console.log(`Using fixed Scale Factor: ${this.scaleFactor.toFixed(3)}`);

        // --- Draw points to offscreen buffer ---
        console.log("Drawing points to offscreen buffer...");
        if (!this.buffer || this.buffer.width !== p.width || this.buffer.height !== p.height) { this.buffer = p.createGraphics(p.width, p.height); this.buffer.colorMode(p.HSB, 360, 100, 100, 1.0); }
        this.buffer.clear(); this.buffer.push();
        const centerX = (this.bounds.minX + this.bounds.maxX) / 2; const centerY = (this.bounds.minY + this.bounds.maxY) / 2;
        this.buffer.translate(this.buffer.width / 2, this.buffer.height / 2); this.buffer.scale(this.scaleFactor); this.buffer.translate(-centerX, -centerY);
        // *** Increased stroke weight for buffer points ***
        this.buffer.strokeWeight(2);
        let hueOffset = p.frameCount * 0.1;
        for (let i = 0; i < this.points.length; i++) {
            const pt = this.points[i]; let hue = p.map(pt[0], this.bounds.minX, this.bounds.maxX, 180, 360) + hueOffset;
            let brightness = p.map(pt[1], this.bounds.minY, this.bounds.maxY, 60, 100); let alpha = 0.7;
            this.buffer.stroke(hue % 360, 80, brightness, alpha); this.buffer.point(pt[0], pt[1]);
        }
        this.buffer.pop(); console.log("Offscreen buffer updated.");
        this.needsRecalculation = false;
    }

    draw(sharedState) { /* ... draw logic remains the same - just draw buffer ... */
        const p = this.p;
        if (this.needsRecalculation) { this.recalculate(); }
        if (this.buffer) { p.image(this.buffer, 0, 0); }
        else { /* ... loading text ... */ }
    }

    // --- Interface Methods ---
    getDisplayName() { return "De Jong Attractor"; }
    getFormula() { return `x_n = sin(a y_{n-1}) - cos(b x_{n-1}) <br> y_n = sin(c x_{n-1}) - cos(d y_{n-1})`; }
    getExplanation() { /* ... explanation HTML ... */ }
    isAnimatable() { return false; }
    activate() {
        console.log("De Jong activate called.");
        this.updateControlsFromState(); // Ensure sliders/spans are correct on activation
        if (this.needsRecalculation) { this.recalculate(); }
        this.p.redraw();
    }

} // End class DeJongVisualization