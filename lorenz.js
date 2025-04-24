// lorenz.js - Module for Lorenz Attractor Visualization

export default class LorenzVisualization {
    constructor(p, controlsElement) {
        this.p = p;
        this.controls = controlsElement;

        // State
        this.sigma = 10;
        this.rho = 28;
        this.beta = 8 / 3;
        this.numSteps = 10000;
        this.dt = 0.01;
        this.points = [];
        this.bounds = { minX: 0, maxX: 0, minZ: 0, maxZ: 0 };
        this.needsRecalculation = true;

        // Get specific controls
        this.sliderSigma = p.select('#lorenzSigma', this.controls.elt); this.valSigma = p.select('#lorenzSigmaVal', this.controls.elt);
        this.sliderRho = p.select('#lorenzRho', this.controls.elt); this.valRho = p.select('#lorenzRhoVal', this.controls.elt);
        this.sliderBeta = p.select('#lorenzBeta', this.controls.elt); this.valBeta = p.select('#lorenzBetaVal', this.controls.elt);
        this.sliderSteps = p.select('#lorenzSteps', this.controls.elt); this.valSteps = p.select('#lorenzStepsVal', this.controls.elt);
        this.sliderDt = p.select('#lorenzDt', this.controls.elt); this.valDt = p.select('#lorenzDtVal', this.controls.elt);
        this.restartBtn = p.select('#restartLorenzBtn', this.controls.elt);

        // Attach listeners
        if (this.sliderSigma) this.sliderSigma.input(() => this.updateParams());
        if (this.sliderRho) this.sliderRho.input(() => this.updateParams());
        if (this.sliderBeta) this.sliderBeta.input(() => this.updateParams());
        if (this.sliderSteps) this.sliderSteps.input(() => this.updateParams());
        if (this.sliderDt) this.sliderDt.input(() => this.updateParams());
        if (this.restartBtn) this.restartBtn.mousePressed(() => this.restart());

        // Initialize display
        this.updateParams();
    }

    updateParams() {
        let changed = false;
        let sigmaTemp = this.sliderSigma ? parseFloat(this.sliderSigma.value()) : this.sigma;
        let rhoTemp = this.sliderRho ? parseFloat(this.sliderRho.value()) : this.rho;
        let betaTemp = this.sliderBeta ? parseFloat(this.sliderBeta.value()) : this.beta;
        let stepsTemp = this.sliderSteps ? parseInt(this.sliderSteps.value()) : this.numSteps;
        let dtTemp = this.sliderDt ? parseFloat(this.sliderDt.value()) : this.dt;

        // Update displays
        if (this.valSigma) this.valSigma.html(sigmaTemp.toFixed(1));
        if (this.valRho) this.valRho.html(rhoTemp.toFixed(1));
        if (this.valBeta) this.valBeta.html(betaTemp.toFixed(2));
        if (this.valSteps) this.valSteps.html(stepsTemp);
        if (this.valDt) this.valDt.html(dtTemp.toFixed(3));

        // Check if state actually changed
        if (sigmaTemp !== this.sigma || rhoTemp !== this.rho || betaTemp !== this.beta || stepsTemp !== this.numSteps || dtTemp !== this.dt) {
            this.sigma = sigmaTemp; this.rho = rhoTemp; this.beta = betaTemp;
            this.numSteps = stepsTemp; this.dt = dtTemp;
            this.needsRecalculation = true;
            changed = true;
            console.log("Lorenz params changed, flagging recalc.");
        }

        if (changed) this.p.redraw(); // Redraw only if params changed
    }

    restart() {
        console.log("Restarting Lorenz Simulation");
        this.needsRecalculation = true;
        this.p.redraw();
    }

    calculate() {
        console.log("Calculating Lorenz points...");
        this.points = []; // Clear previous points
        this.bounds = { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity };
        let v = this.p.createVector(0.1, 0, 0);

        for (let i = 0; i < this.numSteps; i++) {
             if (i > this.numSteps * 0.1 || i === 0) { // Store after transient + first point
                 this.points.push(v.copy());
                 if(i > 0) { // Update bounds after first point
                     this.bounds.minX = Math.min(this.bounds.minX, v.x); this.bounds.maxX = Math.max(this.bounds.maxX, v.x);
                     this.bounds.minZ = Math.min(this.bounds.minZ, v.z); this.bounds.maxZ = Math.max(this.bounds.maxZ, v.z);
                 }
             }
             let dx = this.sigma * (v.y - v.x); let dy = v.x * (this.rho - v.z) - v.y; let dz = v.x * v.y - this.beta * v.z;
             v.x += dx * this.dt; v.y += dy * this.dt; v.z += dz * this.dt;
             if (!isFinite(v.x) || !isFinite(v.y) || !isFinite(v.z)) { console.warn("Lorenz diverged."); this.points.push(v.copy()); break; }
        }
        if (this.bounds.minX === Infinity || this.points.length < 2) { // Handle cases with few points or divergence
            this.bounds = { minX: -20, maxX: 20, minZ: 0, maxZ: 50}; console.warn("Using default bounds.")
        }
        console.log("Lorenz calc complete.", this.points.length, "points.");
        this.needsRecalculation = false;
    }

    draw(sharedState) { // sharedState might include animate, speed later if needed
        const p = this.p; // Use stored p5 instance

        if (this.needsRecalculation) {
            this.calculate();
        }

        if (this.points.length < 2) { // Check if points are available
             p.push(); p.fill(0,0,80); p.textAlign(p.CENTER); p.textSize(16);
             p.text("Calculating Lorenz...", 0, 0); // Centered due to main draw translate
             p.pop();
             return;
        }

        // Drawing logic (dynamic center/scale X vs Z)
        p.push(); // Isolate transforms
        let centerX = (this.bounds.minX + this.bounds.maxX) / 2; let centerZ = (this.bounds.minZ + this.bounds.maxZ) / 2;
        let rangeX = this.bounds.maxX - this.bounds.minX; let rangeZ = this.bounds.maxZ - this.bounds.minZ;
        if (rangeX === 0 || rangeZ === 0 || !isFinite(rangeX) || !isFinite(rangeZ) || !isFinite(centerX) || !isFinite(centerZ)) { console.warn("Lorenz range/center invalid."); p.pop(); return; }
        const padding = 0.90; let scaleX = (p.width * padding) / rangeX; let scaleZ = (p.height * padding) / rangeZ; let scaleFactor = Math.min(scaleX, scaleZ);
        if (!isFinite(scaleFactor) || scaleFactor <= 0) { scaleFactor = 1; } // Prevent invalid scale

        p.translate(p.width / 2, p.height / 2); // Center view in canvas
        p.scale(scaleFactor); p.translate(-centerX, -centerZ); // Scale and center data

        p.strokeWeight(1 / scaleFactor); p.noFill();

        let hu = 0;
        p.beginShape();
        for (let v of this.points) {
            p.stroke(hu % 360, 90, 90, 0.8); // Cycle hue
            p.vertex(v.x, v.z); // Plot X vs Z
            hu += 0.1;
        }
        p.endShape();
        p.pop(); // Restore transform state
    }

    getDisplayName() { return "Lorenz Attractor"; }
    getFormula() { return `dx/dt = &sigma;(y-x), dy/dt = x(&rho;-z)-y, dz/dt = xy-&beta;z <span class='comment'>(2D Projection)</span>`; }
    getExplanation() { return `<h3>Lorenz Attractor</h3><p>...</p><ul>...</ul>`; } // Keep full text
    isAnimatable() { return false; } // Lorenz itself isn't animated here

    showControls() { if (this.controls) this.controls.addClass('active'); }
    hideControls() { if (this.controls) this.controls.removeClass('active'); }
    activate() { this.needsRecalculation = true; this.p.redraw(); /* Trigger initial calc */ }

} // End class LorenzVisualization