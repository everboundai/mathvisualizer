// dejong.js - Module for Peter de Jong Attractor Visualization (Scaling Fix)

export default class DeJongVisualization {
    constructor(p, controlsElement) {
        this.p = p;
        this.controls = controlsElement;
        console.log("DeJongVisualization constructor called.");

        // Default parameters
        this.defaultA = 1.641;
        this.defaultB = -1.902;
        this.defaultC = -1.916;
        this.defaultD = -1.483;
        // *** Reduced default points for initial load ***
        this.defaultNumPoints = 20000; // Reduced from 50000

        // State
        this.a = this.defaultA; this.b = this.defaultB;
        this.c = this.defaultC; this.d = this.defaultD;
        this.numPoints = this.defaultNumPoints;

        this.points = [];
        this.needsRecalculation = true;
        this.bounds = { minX: 0, maxX: 0, minY: 0, maxY: 0 };
        this.scaleFactor = 1.0;

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

        // Initial setup
        this.updateParams();
    }

    addListener(element, eventType, handler) { /* ... as before ... */ }

    updateParams() { /* ... as before, triggers recalc if needed ... */
        let changed = false; let pointsChanged = false;
        let newA = this.sliderA ? parseFloat(this.sliderA.value()) : this.a; let newB = this.sliderB ? parseFloat(this.sliderB.value()) : this.b;
        let newC = this.sliderC ? parseFloat(this.sliderC.value()) : this.c; let newD = this.sliderD ? parseFloat(this.sliderD.value()) : this.d;
        let newNumPoints = this.sliderPoints ? parseInt(this.sliderPoints.value()) : this.numPoints;
        if (newA !== this.a || newB !== this.b || newC !== this.c || newD !== this.d) { this.a = newA; this.b = newB; this.c = newC; this.d = newD; changed = true; console.log("De Jong parameters changed."); }
        if (newNumPoints !== this.numPoints) { this.numPoints = newNumPoints; pointsChanged = true; console.log("De Jong numPoints changed."); }
        if (this.valA) this.valA.html(this.a.toFixed(3)); if (this.valB) this.valB.html(this.b.toFixed(3)); if (this.valC) this.valC.html(this.c.toFixed(3)); if (this.valD) this.valD.html(this.d.toFixed(3)); if (this.valPoints) this.valPoints.html(this.numPoints);
        if (changed || pointsChanged) { this.needsRecalculation = true; this.p.redraw(); }
    }

    resetDefaults() { /* ... as before, but uses new defaultNumPoints ... */
        console.log("Resetting De Jong parameters to defaults.");
        this.a = this.defaultA; this.b = this.defaultB; this.c = this.defaultC; this.d = this.defaultD;
        this.numPoints = this.defaultNumPoints; // Use updated default
        if (this.sliderA) this.sliderA.value(this.a); if (this.sliderB) this.sliderB.value(this.b); if (this.sliderC) this.sliderC.value(this.c); if (this.sliderD) this.sliderD.value(this.d);
        if (this.sliderPoints) this.sliderPoints.value(this.numPoints);
        this.needsRecalculation = true; this.updateParams(); this.p.redraw();
    }

    recalculate() {
        if (!this.needsRecalculation) return;
        console.log(`Recalculating De Jong Attractor for ${this.numPoints} points...`);
        const p = this.p;
        this.points = [];
        let x = 0, y = 0;
        let minX = 0, maxX = 0, minY = 0, maxY = 0;

        for (let i = 0; i < this.numPoints; i++) { /* ... calculate x, y as before ... */
            let prevX = x; let prevY = y;
            x = p.sin(this.a * prevY) - p.cos(this.b * prevX);
            y = p.sin(this.c * prevX) - p.cos(this.d * prevY);
            this.points.push([x, y]);
            if (i === 0) { minX = maxX = x; minY = maxY = y; }
            else { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
        }
        if (maxX === minX) maxX += 1e-6; if (maxY === minY) maxY += 1e-6;
        this.bounds = { minX, maxX, minY, maxY };
        console.log("Bounds calculated:", this.bounds);

        // --- Calculate Scale Factor with Clamping ---
        const boundsWidth = this.bounds.maxX - this.bounds.minX;
        const boundsHeight = this.bounds.maxY - this.bounds.minY;
        const padding = 0.90;
        let calculatedScale = 1.0; // Default

        // Sensible fallback scale - map approx +/- 2.5 range to canvas width
        const fallbackScale = (p.width * padding) / 5.0;

        if (boundsWidth <= 1e-6 || boundsHeight <= 1e-6 || !isFinite(boundsWidth) || !isFinite(boundsHeight)) {
            console.warn("Degenerate bounds detected. Using fallback scale.");
            calculatedScale = fallbackScale;
        } else {
            let scaleX = (p.width * padding) / boundsWidth;
            let scaleY = (p.height * padding) / boundsHeight;
            calculatedScale = Math.min(scaleX, scaleY);
        }

        if (!isFinite(calculatedScale) || calculatedScale <= 0) {
            console.warn("Invalid scale factor calculated. Using fallback scale.");
            calculatedScale = fallbackScale;
        }

        // *** Clamp the scale factor to prevent excessive zooming ***
        // Max scale could map e.g. a range of 0.1 to the canvas width
        const maxSensibleScale = (p.width * padding) / 0.1;
        this.scaleFactor = Math.min(calculatedScale, maxSensibleScale);
        // ***

        console.log(`Final Scale Factor: ${this.scaleFactor.toFixed(3)}`);

        this.needsRecalculation = false;
    }

    draw(sharedState) {
        const p = this.p;
        if (this.needsRecalculation) { this.recalculate(); }
        if (this.points.length === 0) { /* ... loading text ... */ return; }

        p.push(); // Isolate transforms

        const centerX = (this.bounds.minX + this.bounds.maxX) / 2;
        const centerY = (this.bounds.minY + this.bounds.maxY) / 2;

        // Apply transformations
        p.translate(p.width / 2, p.height / 2);
        p.scale(this.scaleFactor); // Use clamped scale factor
        p.translate(-centerX, -centerY);

        // Drawing style
        p.strokeWeight(1);
        p.colorMode(p.HSB, 360, 100, 100, 1.0);
        let hueOffset = p.frameCount * 0.1;

        // *** Draw points ***
        for (let i = 0; i < this.points.length; i++) {
            const pt = this.points[i];
            // Make points slightly more visible - increase alpha, maybe size
            let hue = p.map(pt[0], this.bounds.minX, this.bounds.maxX, 180, 360) + hueOffset;
            let brightness = p.map(pt[1], this.bounds.minY, this.bounds.maxY, 60, 100);
            let alpha = 0.7; // Slightly less transparent
            p.stroke(hue % 360, 80, brightness, alpha);
            p.point(pt[0], pt[1]);
        }

        p.pop();
        p.colorMode(p.HSB, 360, 100, 100, 1.0); // Reset color mode
    }

    // --- Interface Methods ---
    getDisplayName() { return "De Jong Attractor"; }
    getFormula() { return `x_n = sin(a y_{n-1}) - cos(b x_{n-1}) <br> y_n = sin(c x_{n-1}) - cos(d y_{n-1})`; }
    getExplanation() { /* ... explanation HTML ... */ }
    isAnimatable() { return false; }
    activate() { /* ... as before ... */ }

} // End class DeJongVisualization
