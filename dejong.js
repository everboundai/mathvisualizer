// dejong.js - Module for Peter de Jong Attractor Visualization (Offscreen Buffer & Fixed Scale)

export default class DeJongVisualization {
    constructor(p, controlsElement) {
        this.p = p;
        this.controls = controlsElement;
        console.log("DeJongVisualization constructor called.");

        // Default parameters
        this.defaultA = 1.641; this.defaultB = -1.902;
        this.defaultC = -1.916; this.defaultD = -1.483;
        this.defaultNumPoints = 10000; // Reduced default further
        this.defaultSkipPoints = 1000; // Points to iterate before recording/bounding

        // State
        this.a = this.defaultA; this.b = this.defaultB;
        this.c = this.defaultC; this.d = this.defaultD;
        this.numPoints = this.defaultNumPoints;
        this.skipPoints = this.defaultSkipPoints; // How many initial points to ignore for bounds

        this.points = []; // Still store points for potential future use (e.g., data export)
        this.needsRecalculation = true;
        this.bounds = { minX: 0, maxX: 0, minY: 0, maxY: 0 };
        this.scaleFactor = 1.0; // Will be calculated based on canvas size
        this.buffer = null; // Offscreen graphics buffer

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

        // Create buffer immediately in setup to avoid issues if recalc is slow
        this.buffer = p.createGraphics(p.width, p.height);
        this.buffer.colorMode(p.HSB, 360, 100, 100, 1.0); // Set color mode for buffer

        // Initial setup
        this.updateParams();
    }

    addListener(element, eventType, handler) { /* ... as before ... */ }
    updateParams() { /* ... as before, triggers recalc if needed ... */ }
    resetDefaults() { /* ... as before, uses new defaultNumPoints ... */ }

    recalculate() {
        if (!this.needsRecalculation) return;
        console.log(`Recalculating De Jong Attractor for ${this.numPoints} points (skipping first ${this.skipPoints})...`);
        const p = this.p;
        this.points = []; // Clear points array
        let x = 0, y = 0;
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        let firstPointBounded = false;

        // --- Iteration Loop ---
        for (let i = 0; i < this.numPoints + this.skipPoints; i++) {
            // Calculate next point
            let prevX = x; let prevY = y;
            x = p.sin(this.a * prevY) - p.cos(this.b * prevX);
            y = p.sin(this.c * prevX) - p.cos(this.d * prevY);

            // Start recording points and calculating bounds only after skipping initial points
            if (i >= this.skipPoints) {
                this.points.push([x, y]); // Store point

                // Update bounds
                if (!firstPointBounded) {
                    minX = maxX = x; minY = maxY = y;
                    firstPointBounded = true;
                } else {
                    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
                    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
                }
            }
        } // End iteration loop

        if (!firstPointBounded) { // Handle case where numPoints might be 0 or negative
             console.warn("No points were bounded. Using default bounds.");
             minX = -2; maxX = 2; minY = -2; maxY = 2; // Default reasonable range
        } else {
             // Add a tiny margin if bounds have zero width/height
             if (maxX === minX) maxX += 1e-6;
             if (maxY === minY) maxY += 1e-6;
        }
        this.bounds = { minX, maxX, minY, maxY };
        console.log("Bounds calculated (after skip):", this.bounds);

        // --- Fixed Scaling ---
        const padding = 0.90;
        // Calculate scale to map a typical attractor range (e.g., -2.25 to 2.25 -> range 4.5) to canvas
        const typicalRange = 4.5;
        this.scaleFactor = Math.min(p.width * padding / typicalRange, p.height * padding / typicalRange);
        console.log(`Using fixed Scale Factor: ${this.scaleFactor.toFixed(3)}`);

        // --- Draw points to offscreen buffer ---
        console.log("Drawing points to offscreen buffer...");
        if (!this.buffer || this.buffer.width !== p.width || this.buffer.height !== p.height) {
             // Recreate buffer if canvas resized
             this.buffer = p.createGraphics(p.width, p.height);
             this.buffer.colorMode(p.HSB, 360, 100, 100, 1.0);
        }

        // Prepare buffer
        this.buffer.clear(); // Use clear for transparency
        this.buffer.push(); // Isolate transforms for buffer

        // Apply transforms to buffer coordinate system
        const centerX = (this.bounds.minX + this.bounds.maxX) / 2;
        const centerY = (this.bounds.minY + this.bounds.maxY) / 2;
        this.buffer.translate(this.buffer.width / 2, this.buffer.height / 2);
        this.buffer.scale(this.scaleFactor);
        this.buffer.translate(-centerX, -centerY);

        // Set drawing style in buffer
        this.buffer.strokeWeight(1); // Adjust as needed
        let hueOffset = p.frameCount * 0.1; // Use main frameCount for cycling color

        // Draw all calculated points (those stored after skipping)
        for (let i = 0; i < this.points.length; i++) {
            const pt = this.points[i];
            let hue = p.map(pt[0], this.bounds.minX, this.bounds.maxX, 180, 360) + hueOffset;
            let brightness = p.map(pt[1], this.bounds.minY, this.bounds.maxY, 60, 100);
            let alpha = 0.7;
            this.buffer.stroke(hue % 360, 80, brightness, alpha);
            this.buffer.point(pt[0], pt[1]);
        }

        this.buffer.pop(); // Restore buffer state
        console.log("Offscreen buffer updated.");

        this.needsRecalculation = false; // Mark as done
    }

    draw(sharedState) {
        const p = this.p;

        if (this.needsRecalculation) {
            this.recalculate();
        }

        // If buffer exists, draw it. Otherwise show loading.
        if (this.buffer) {
            p.image(this.buffer, 0, 0); // Draw the pre-rendered buffer
        } else {
             p.push(); p.fill(0,0,80); p.textAlign(p.CENTER); p.textSize(16);
             p.text("Calculating Attractor...", p.width/2, p.height/2);
             p.pop(); return;
        }
    }

    // --- Interface Methods ---
    getDisplayName() { return "De Jong Attractor"; }
    getFormula() { return `x_n = sin(a y_{n-1}) - cos(b x_{n-1}) <br> y_n = sin(c x_{n-1}) - cos(d y_{n-1})`; }
    getExplanation() { /* ... explanation HTML ... */ }
    isAnimatable() { return false; }
    activate() { /* ... as before ... */ }

} // End class DeJongVisualization