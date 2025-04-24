// lorenz.js - Module for Lorenz Attractor Visualization

export default class LorenzVisualization {
    constructor(p, controlsElement) {
        this.p = p;
        this.controls = controlsElement;

        // Default State Values
        this.defaultSigma = 10;
        this.defaultRho = 28;
        this.defaultBeta = 8 / 3;
        this.defaultNumSteps = 10000;
        this.defaultDt = 0.01;

        // Current State (initialize with defaults)
        this.sigma = this.defaultSigma;
        this.rho = this.defaultRho;
        this.beta = this.defaultBeta;
        this.numSteps = this.defaultNumSteps;
        this.dt = this.defaultDt;

        this.points = [];
        this.bounds = { minX: 0, maxX: 0, minZ: 0, maxZ: 0 };
        this.needsRecalculation = true;

        // Get specific controls
        this.sliderSigma = p.select('#lorenzSigma', this.controls.elt);
        this.valSigma = p.select('#lorenzSigmaVal', this.controls.elt);
        this.sliderRho = p.select('#lorenzRho', this.controls.elt);
        this.valRho = p.select('#lorenzRhoVal', this.controls.elt);
        this.sliderBeta = p.select('#lorenzBeta', this.controls.elt);
        this.valBeta = p.select('#lorenzBetaVal', this.controls.elt);
        this.sliderSteps = p.select('#lorenzSteps', this.controls.elt);
        this.valSteps = p.select('#lorenzStepsVal', this.controls.elt);
        this.sliderDt = p.select('#lorenzDt', this.controls.elt);
        this.valDt = p.select('#lorenzDtVal', this.controls.elt);
        // Use the new ID for the reset button
        this.resetBtn = p.select('#resetLorenzBtn', this.controls.elt);

        // Attach listeners
        this.addListener(this.sliderSigma, 'input', this.updateParams);
        this.addListener(this.sliderRho, 'input', this.updateParams);
        this.addListener(this.sliderBeta, 'input', this.updateParams);
        this.addListener(this.sliderSteps, 'input', this.updateParams);
        this.addListener(this.sliderDt, 'input', this.updateParams);
        // Attach listener for the reset button, calling resetDefaults
        if (this.resetBtn) {
            this.resetBtn.mousePressed(() => this.resetDefaults());
            console.log("Lorenz Reset button listener attached.");
        } else {
            console.warn("Lorenz Reset Button (#resetLorenzBtn) not found within #lorenzControls");
        }

        // Initialize display and calculation
        this.updateParams(); // Ensure UI matches initial state
    }

    // Helper to add listener and bind 'this' correctly
    addListener(element, eventType, handler) {
        if (element) {
            element[eventType](() => handler.call(this)); // Use arrow function to preserve 'this'
        } else {
            console.warn(`Lorenz control element not found during listener attachment.`);
        }
    }

    updateParams() {
        let changed = false;
        // Read values from sliders if they exist
        let sigmaTemp = this.sliderSigma ? parseFloat(this.sliderSigma.value()) : this.sigma;
        let rhoTemp = this.sliderRho ? parseFloat(this.sliderRho.value()) : this.rho;
        let betaTemp = this.sliderBeta ? parseFloat(this.sliderBeta.value()) : this.beta;
        let stepsTemp = this.sliderSteps ? parseInt(this.sliderSteps.value()) : this.numSteps;
        let dtTemp = this.sliderDt ? parseFloat(this.sliderDt.value()) : this.dt;

        // Check if state actually changed compared to internal state
        if (sigmaTemp !== this.sigma || rhoTemp !== this.rho || betaTemp !== this.beta || stepsTemp !== this.numSteps || dtTemp !== this.dt) {
            this.sigma = sigmaTemp;
            this.rho = rhoTemp;
            this.beta = betaTemp;
            this.numSteps = stepsTemp;
            this.dt = dtTemp;
            this.needsRecalculation = true;
            changed = true;
            console.log("Lorenz params changed, flagging recalc.");
        }

        // Update display spans regardless of change (needed after resetDefaults too)
        if (this.valSigma) this.valSigma.html(this.sigma.toFixed(1));
        if (this.valRho) this.valRho.html(this.rho.toFixed(1));
        if (this.valBeta) this.valBeta.html(this.beta.toFixed(2));
        if (this.valSteps) this.valSteps.html(this.numSteps);
        if (this.valDt) this.valDt.html(this.dt.toFixed(3));

        // Redraw only if params changed
        if (changed) {
            this.p.redraw();
        }
    }

    // Renamed from restart()
    resetDefaults() {
        console.log("Resetting Lorenz parameters to defaults.");
        // Set internal state back to defaults
        this.sigma = this.defaultSigma;
        this.rho = this.defaultRho;
        this.beta = this.defaultBeta;
        this.numSteps = this.defaultNumSteps;
        this.dt = this.defaultDt;

        // Update slider positions to match defaults
        if (this.sliderSigma) this.sliderSigma.value(this.sigma);
        if (this.sliderRho) this.sliderRho.value(this.rho);
        if (this.sliderBeta) this.sliderBeta.value(this.beta);
        if (this.sliderSteps) this.sliderSteps.value(this.numSteps);
        if (this.sliderDt) this.sliderDt.value(this.dt);

        // Update the display values and trigger recalculation/redraw
        this.needsRecalculation = true;
        this.updateParams(); // Update spans
        this.p.redraw();     // Trigger redraw
    }

    calculate() {
        console.log("Calculating Lorenz points...");
        this.points = []; // Clear previous points
        this.bounds = { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity };
        let v = this.p.createVector(0.1, 0, 0); // Initial condition

        // Optional: Skip initial transient points for cleaner attractor
        let transientSteps = Math.min(1000, Math.floor(this.numSteps * 0.1));
        for (let i = 0; i < transientSteps; i++) {
             let dx = this.sigma * (v.y - v.x);
             let dy = v.x * (this.rho - v.z) - v.y;
             let dz = v.x * v.y - this.beta * v.z;
             v.x += dx * this.dt;
             v.y += dy * this.dt;
             v.z += dz * this.dt;
             if (!isFinite(v.x) || !isFinite(v.y) || !isFinite(v.z)) {
                console.warn("Lorenz diverged during transient phase.");
                break;
             }
        }


        for (let i = 0; i < this.numSteps; i++) {
             // Calculate differentials
             let dx = this.sigma * (v.y - v.x);
             let dy = v.x * (this.rho - v.z) - v.y;
             let dz = v.x * v.y - this.beta * v.z;

             // Update vector using Euler integration
             v.x += dx * this.dt;
             v.y += dy * this.dt;
             v.z += dz * this.dt;

             // Store the point
             this.points.push(v.copy());

             // Update bounds (only using x and z for 2D projection)
             this.bounds.minX = Math.min(this.bounds.minX, v.x);
             this.bounds.maxX = Math.max(this.bounds.maxX, v.x);
             this.bounds.minZ = Math.min(this.bounds.minZ, v.z);
             this.bounds.maxZ = Math.max(this.bounds.maxZ, v.z);

             // Check for divergence
             if (!isFinite(v.x) || !isFinite(v.y) || !isFinite(v.z)) {
                 console.warn(`Lorenz diverged at step ${i}.`);
                 break; // Stop calculation if values become non-finite
             }
        }

        // Handle cases with few points or divergence during main loop
        if (this.bounds.minX === Infinity || this.points.length < 2) {
            console.warn("Lorenz calculation resulted in invalid bounds or too few points. Using default bounds.");
            this.bounds = { minX: -20, maxX: 20, minZ: 0, maxZ: 50};
        } else {
             // Add padding to bounds for better visualization
            let xRange = this.bounds.maxX - this.bounds.minX;
            let zRange = this.bounds.maxZ - this.bounds.minZ;
            this.bounds.minX -= xRange * 0.05; this.bounds.maxX += xRange * 0.05;
            this.bounds.minZ -= zRange * 0.05; this.bounds.maxZ += zRange * 0.05;
        }

        console.log(`Lorenz calc complete. ${this.points.length} points.`);
        this.needsRecalculation = false;
    }

    draw(sharedState) { // sharedState is not used here but kept for consistent interface
        const p = this.p;

        if (this.needsRecalculation) {
            this.calculate();
        }

        if (this.points.length < 2) { // Check if points are available
             p.push(); p.fill(0,0,80); p.textAlign(p.CENTER); p.textSize(16);
             p.text("Calculating Lorenz...", p.width / 2, p.height / 2); // Draw centered on canvas
             p.pop();
             return;
        }

        // --- Drawing logic (dynamic center/scale X vs Z) ---
        p.push(); // Isolate transforms

        // Calculate scaling factors based on calculated bounds and canvas size
        let centerX = (this.bounds.minX + this.bounds.maxX) / 2;
        let centerZ = (this.bounds.minZ + this.bounds.maxZ) / 2;
        let rangeX = this.bounds.maxX - this.bounds.minX;
        let rangeZ = this.bounds.maxZ - this.bounds.minZ;

        // Prevent division by zero or invalid ranges
        if (rangeX === 0 || rangeZ === 0 || !isFinite(rangeX) || !isFinite(rangeZ) || !isFinite(centerX) || !isFinite(centerZ)) {
            console.warn("Lorenz range/center invalid for drawing.");
            p.pop(); return;
        }

        // Determine scale factor to fit the attractor within ~90% of the canvas
        const padding = 0.90;
        let scaleX = (p.width * padding) / rangeX;
        let scaleZ = (p.height * padding) / rangeZ;
        let scaleFactor = Math.min(scaleX, scaleZ); // Use the smaller scale factor to fit both axes

        // Prevent invalid scale
        if (!isFinite(scaleFactor) || scaleFactor <= 0) {
            console.warn("Calculated invalid scale factor. Using scale=1.");
            scaleFactor = 1;
        }

        // Apply transformations: Center the canvas, then scale, then translate data center to origin
        p.translate(p.width / 2, p.height / 2);
        p.scale(scaleFactor);
        p.translate(-centerX, -centerZ);

        // Set drawing style
        p.strokeWeight(1 / scaleFactor); // Keep line weight consistent regardless of zoom
        p.noFill();

        // Draw the points using vertex points in a shape
        p.beginShape();
        let hu = 0; // Hue for coloring
        for (let v of this.points) {
            p.stroke(hu % 360, 90, 90, 0.7); // Cycle hue, slightly transparent
            p.vertex(v.x, v.z); // Plot X vs Z
            hu += 0.1; // Increment hue slightly for each point
        }
        p.endShape();

        p.pop(); // Restore original drawing state
    }

    // --- Interface Methods ---
    getDisplayName() { return "Lorenz Attractor"; }
    getFormula() { return `dx/dt = &sigma;(y-x), dy/dt = x(&rho;-z)-y, dz/dt = xy-&beta;z <span class='comment'>(X-Z Projection)</span>`; }
    getExplanation() {
        // Placeholder - assumes explanation is loaded from elsewhere or defined here
        return `<h3>Lorenz Attractor</h3><p>A system of ordinary differential equations first studied by Edward Lorenz. It is notable for having chaotic solutions for certain parameter values and initial conditions. The attractor itself is a fractal.</p><p>This visualization shows a 2D projection (X vs Z axes) of the path traced by the system over time.</p><p><strong>Parameters:</strong></p><ul><li><span class="variable">&sigma;</span> (Sigma): Prandtl number. Classic: 10.</li><li><span class="variable">&rho;</span> (Rho): Rayleigh number. Classic: 28.</li><li><span class="variable">&beta;</span> (Beta): Geometric factor. Classic: 8/3 ≈ 2.67.</li><li><code>Points</code>: Number of simulation steps.</li><li><code>dt</code>: Time step size for integration.</li></ul>`;
    }
    isAnimatable() { return false; } // Lorenz itself isn't animated here

    activate() {
        console.log("Lorenz activate called.");
        this.needsRecalculation = true; // Ensure recalculation when activated
        this.updateParams(); // Update UI display
        this.p.redraw();
    }

} // End class LorenzVisualization