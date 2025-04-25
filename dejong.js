// dejong.js - Module for Peter de Jong Attractor Visualization

export default class DeJongVisualization {
    constructor(p, controlsElement) {
        this.p = p;
        this.controls = controlsElement;
        console.log("DeJongVisualization constructor called.");

        // Default parameters (known to produce interesting patterns)
        this.defaultA = 1.641;
        this.defaultB = -1.902;
        this.defaultC = -1.916;
        this.defaultD = -1.483;
        this.defaultNumPoints = 50000; // Number of points to calculate and draw

        // State
        this.a = this.defaultA;
        this.b = this.defaultB;
        this.c = this.defaultC;
        this.d = this.defaultD;
        this.numPoints = this.defaultNumPoints;

        this.points = []; // Array to store [x, y] pairs
        this.needsRecalculation = true;
        this.bounds = { minX: 0, maxX: 0, minY: 0, maxY: 0 }; // To store bounds for scaling
        this.scaleFactor = 1.0; // Scaling factor

        // Get specific controls (IDs will be added to index.html)
        this.sliderA = p.select('#dejongA', this.controls?.elt); this.valA = p.select('#dejongAVal', this.controls?.elt);
        this.sliderB = p.select('#dejongB', this.controls?.elt); this.valB = p.select('#dejongBVal', this.controls?.elt);
        this.sliderC = p.select('#dejongC', this.controls?.elt); this.valC = p.select('#dejongCVal', this.controls?.elt);
        this.sliderD = p.select('#dejongD', this.controls?.elt); this.valD = p.select('#dejongDVal', this.controls?.elt);
        this.sliderPoints = p.select('#dejongPoints', this.controls?.elt); this.valPoints = p.select('#dejongPointsVal', this.controls?.elt);
        this.resetBtn = p.select('#resetDeJongBtn', this.controls?.elt); // Add a reset button

        // Attach listeners
        this.addListener(this.sliderA, 'input', this.updateParams);
        this.addListener(this.sliderB, 'input', this.updateParams);
        this.addListener(this.sliderC, 'input', this.updateParams);
        this.addListener(this.sliderD, 'input', this.updateParams);
        this.addListener(this.sliderPoints, 'input', this.updateParams);
        if (this.resetBtn) { this.resetBtn.mousePressed(() => this.resetDefaults()); }

        // Initial setup
        this.updateParams(); // Set initial values and trigger calculation
    }

    addListener(element, eventType, handler) {
        if (element) { element[eventType](() => handler.call(this)); }
        else { console.warn(`De Jong control element not found during listener attachment.`); }
    }

    updateParams() {
        let changed = false;
        let pointsChanged = false;

        // Read parameters from sliders
        let newA = this.sliderA ? parseFloat(this.sliderA.value()) : this.a;
        let newB = this.sliderB ? parseFloat(this.sliderB.value()) : this.b;
        let newC = this.sliderC ? parseFloat(this.sliderC.value()) : this.c;
        let newD = this.sliderD ? parseFloat(this.sliderD.value()) : this.d;
        let newNumPoints = this.sliderPoints ? parseInt(this.sliderPoints.value()) : this.numPoints;

        // Check if core attractor parameters changed
        if (newA !== this.a || newB !== this.b || newC !== this.c || newD !== this.d) {
            this.a = newA; this.b = newB; this.c = newC; this.d = newD;
            changed = true;
            console.log("De Jong parameters changed.");
        }
        // Check if number of points changed
        if (newNumPoints !== this.numPoints) {
            this.numPoints = newNumPoints;
            pointsChanged = true; // Needs recalc, but maybe not full bounds update if params are same
            console.log("De Jong numPoints changed.");
        }

        // Update display spans
        if (this.valA) this.valA.html(this.a.toFixed(3));
        if (this.valB) this.valB.html(this.b.toFixed(3));
        if (this.valC) this.valC.html(this.c.toFixed(3));
        if (this.valD) this.valD.html(this.d.toFixed(3));
        if (this.valPoints) this.valPoints.html(this.numPoints);

        // Trigger recalculation if needed
        if (changed || pointsChanged) {
            this.needsRecalculation = true;
            this.p.redraw(); // Request redraw, calculation happens in draw cycle
        }
    }

    resetDefaults() {
        console.log("Resetting De Jong parameters to defaults.");
        this.a = this.defaultA; this.b = this.defaultB;
        this.c = this.defaultC; this.d = this.defaultD;
        this.numPoints = this.defaultNumPoints;

        // Update sliders
        if (this.sliderA) this.sliderA.value(this.a); if (this.sliderB) this.sliderB.value(this.b);
        if (this.sliderC) this.sliderC.value(this.c); if (this.sliderD) this.sliderD.value(this.d);
        if (this.sliderPoints) this.sliderPoints.value(this.numPoints);

        // Update display values and trigger recalculation/redraw
        this.needsRecalculation = true;
        this.updateParams(); // Update spans
        this.p.redraw();
    }

    recalculate() {
        if (!this.needsRecalculation) return;
        console.log(`Recalculating De Jong Attractor for ${this.numPoints} points...`);
        this.points = []; // Clear previous points
        let x = 0; // Initial conditions
        let y = 0;
        let minX = 0, maxX = 0, minY = 0, maxY = 0;

        // Use p5's sin/cos which respect angleMode (DEGREES set globally)
        const p = this.p;

        for (let i = 0; i < this.numPoints; i++) {
            let prevX = x;
            let prevY = y;

            x = p.sin(this.a * prevY) - p.cos(this.b * prevX);
            y = p.sin(this.c * prevX) - p.cos(this.d * prevY);

            this.points.push([x, y]); // Store as [x, y] array

            // Update bounds dynamically
            if (i === 0) { // Initialize bounds on first point
                minX = maxX = x; minY = maxY = y;
            } else {
                minX = Math.min(minX, x); maxX = Math.max(maxX, x);
                minY = Math.min(minY, y); maxY = Math.max(maxY, y);
            }
        }

        // Add margin to bounds if they are zero width/height
        if (maxX === minX) maxX += 1e-6;
        if (maxY === minY) maxY += 1e-6;
        this.bounds = { minX, maxX, minY, maxY };
        console.log("Bounds calculated:", this.bounds);

        // Calculate scale factor to fit bounds into canvas
        const boundsWidth = this.bounds.maxX - this.bounds.minX;
        const boundsHeight = this.bounds.maxY - this.bounds.minY;
        const padding = 0.90; // Use 90% of canvas

        if (boundsWidth <= 0 || boundsHeight <= 0 || !isFinite(boundsWidth) || !isFinite(boundsHeight)) {
            this.scaleFactor = 100; // Default scale if bounds are degenerate (points often near +/- 2)
        } else {
            let scaleX = (p.width * padding) / boundsWidth;
            let scaleY = (p.height * padding) / boundsHeight;
            this.scaleFactor = Math.min(scaleX, scaleY);
        }
         if (!isFinite(this.scaleFactor) || this.scaleFactor <= 0) {
            console.warn("Invalid scale factor calculated. Defaulting to 100.");
            this.scaleFactor = 100; // Sensible default guess for typical attractor size
        }
        console.log(`Scale Factor: ${this.scaleFactor.toFixed(3)}`);

        this.needsRecalculation = false; // Mark as done
    }

    draw(sharedState) { // sharedState not used, but keep for consistency
        const p = this.p;

        if (this.needsRecalculation) {
            this.recalculate();
        }

        if (this.points.length === 0) {
             p.push(); p.fill(0,0,80); p.textAlign(p.CENTER); p.textSize(16);
             p.text("Calculating Attractor...", p.width/2, p.height/2); // Draw centered on canvas
             p.pop(); return;
        }

        // --- Drawing Logic ---
        p.push(); // Isolate transforms

        // Calculate center of the calculated bounds
        const centerX = (this.bounds.minX + this.bounds.maxX) / 2;
        const centerY = (this.bounds.minY + this.bounds.maxY) / 2;

        // Apply transformations to center and scale
        p.translate(p.width / 2, p.height / 2);
        p.scale(this.scaleFactor);
        p.translate(-centerX, -centerY);

        // Set drawing style for points
        p.strokeWeight(1); // Use thin points
        // Color points based on position or index for visual interest
        p.colorMode(p.HSB, 360, 100, 100, 1.0); // Ensure HSB mode
        let hueOffset = p.frameCount * 0.1; // Slowly cycle base hue

        for (let i = 0; i < this.points.length; i++) {
            const pt = this.points[i];
            // Example coloring: hue based on X position, brightness on Y
            let hue = p.map(pt[0], this.bounds.minX, this.bounds.maxX, 180, 360) + hueOffset; // Teal to Magenta range + cycle
            let brightness = p.map(pt[1], this.bounds.minY, this.bounds.maxY, 60, 100);
            let alpha = 0.6; // Use some transparency to show density
            p.stroke(hue % 360, 80, brightness, alpha);
            p.point(pt[0], pt[1]);
        }

        p.pop(); // Restore original drawing state
        p.colorMode(p.HSB, 360, 100, 100, 1.0); // Reset color mode just in case
    }

    // --- Interface Methods ---
    getDisplayName() { return "De Jong Attractor"; }
    getFormula() { return `x_n = sin(a y_{n-1}) - cos(b x_{n-1}) <br> y_n = sin(c x_{n-1}) - cos(d y_{n-1})`; }
    getExplanation() {
        return `<h3>Peter de Jong Attractor</h3><p>This visualization shows a strange attractor generated by a simple set of recursive equations defined by Peter de Jong. The position of each new point $(x_n, y_n)$ is determined solely by the position of the previous point $(x_{n-1}, y_{n-1})$ and four parameters (a, b, c, d).</p><p>Despite the simplicity of the rules, the resulting pattern can be incredibly complex, chaotic, and visually striking, demonstrating how intricate structures can emerge from simple recursive processes.</p><p>Adjust the parameters $a, b, c, d$ to explore different attractor shapes. 'Points' controls the number of points calculated and drawn.</p>`;
    }
    isAnimatable() { return false; } // Typically drawn statically, though point-by-point animation is possible

    activate() {
        console.log("De Jong activate called.");
        if (this.needsRecalculation) {
            this.recalculate();
        }
        this.updateParams(); // Ensure UI reflects state
        this.p.redraw();
    }

} // End class DeJongVisualization