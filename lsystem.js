// lsystem.js - Module for L-System Visualization with Auto-Scaling (Attempt 2)

// Helper for presets
const presets = {
    plant: { axiom: "X", rules: { "X": "F+[[X]-X]-F[-FX]+X", "F": "FF" }, angle: 25, startAngle: -90 },
    koch: { axiom: "F", rules: { "F": "F+F-F-F+F" }, angle: 90, startAngle: 0 },
    dragon: { axiom: "FX", rules: { "X": "X+YF+", "Y": "-FX-Y" }, angle: 90, startAngle: 0 },
};

export default class LSystemVisualization {
    constructor(p, controlsElement) {
        console.log("LSystemVisualization constructor called.");
        this.p = p;
        this.controls = controlsElement;
        if (!this.controls) console.error("LSystem controls div not passed correctly!");

        // State
        this.ruleSetKey = 'plant';
        this.iterations = 4;
        this.angle = presets[this.ruleSetKey].angle;
        this.stepLength = 5;
        this.lstring = "";
        this.needsGeneration = true;
        this.currentIndex = 0;

        // Bounds and Transform State
        this.bounds = { minX: 0, maxX: 0, minY: 0, maxY: 0, calculated: false };
        this.scaleFactor = 1.0;
        this.offsetX = 0;
        this.offsetY = 0;

        // Get specific controls...
        this.presetSelect = p.select('#lsystemPreset', this.controls?.elt);
        this.iterationsSlider = p.select('#lsystemIterations', this.controls?.elt);
        this.iterationsValSpan = p.select('#lsystemIterationsVal', this.controls?.elt);
        this.angleSlider = p.select('#lsystemAngle', this.controls?.elt);
        this.angleValSpan = p.select('#lsystemAngleVal', this.controls?.elt);
        this.stepLengthSlider = p.select('#lsystemStepLength', this.controls?.elt);
        this.stepLengthValSpan = p.select('#lsystemStepLengthVal', this.controls?.elt);
        this.restartBtn = p.select('#restartLSystemBtn', this.controls?.elt);

        // Attach listeners...
        this.addListener(this.presetSelect, 'changed', this.updateParams);
        this.addListener(this.iterationsSlider, 'input', this.updateParams);
        this.addListener(this.angleSlider, 'input', this.updateParams);
        this.addListener(this.stepLengthSlider, 'input', this.updateParams);
        if (this.restartBtn) { this.restartBtn.mousePressed(() => this.restart()); }

        // Initial setup
        this.updateControls();
        this.generateAndCalculateBounds();
    }

    addListener(element, eventType, handler) { /* ... as before ... */
        if (element) { element[eventType](() => handler.call(this)); }
        else { console.warn(`L-System control element not found during listener attachment.`); }
    }

    updateParams() {
        let presetChanged = false;
        let needsRegen = false;
        let logReason = "";

        if (this.presetSelect) {
            let newPresetKey = this.presetSelect.value();
            if (newPresetKey !== this.ruleSetKey && presets[newPresetKey]) {
                this.ruleSetKey = newPresetKey; this.angle = presets[this.ruleSetKey].angle;
                presetChanged = true; needsRegen = true; logReason += "Preset changed. ";
            }
        }
        if (this.iterationsSlider) {
            let newIterations = parseInt(this.iterationsSlider.value());
            if (newIterations !== this.iterations) { this.iterations = newIterations; needsRegen = true; logReason += "Iterations changed. ";}
            if (this.iterationsValSpan) this.iterationsValSpan.html(this.iterations);
        }
        if (this.angleSlider) {
            if (presetChanged) { this.angleSlider.value(this.angle); } // Update slider if preset changed angle
            let newAngle = parseFloat(this.angleSlider.value()); // Read current slider value
            if (newAngle !== this.angle) { this.angle = newAngle; needsRegen = true; logReason += "Angle changed. ";}
            if (this.angleValSpan) this.angleValSpan.html(this.angle.toFixed(0));
        }
        if (this.stepLengthSlider) {
            let newLength = parseFloat(this.stepLengthSlider.value());
            if (newLength !== this.stepLength) { this.stepLength = newLength; needsRegen = true; logReason += "Length changed. ";}
            if (this.stepLengthValSpan) this.stepLengthValSpan.html(this.stepLength.toFixed(0));
        }

        if (needsRegen) {
            console.log("Flagging regen & bounds calc due to:", logReason);
            this.needsGeneration = true;
            this.resetAnimation();
            this.p.redraw(); // Redraw will trigger generateAndCalculateBounds if flag is set
        }
         // No else redraw here, redraw happens anyway via p5 loop if needed
    }

    updateControls() { /* ... as before ... */ }

    restart() { /* ... as before ... */
        console.log("L-System Restart (Regenerate) called.");
        this.needsGeneration = true; this.resetAnimation();
        this.p.redraw();
    }

    resetAnimation() { this.currentIndex = 0; }

    generateAndCalculateBounds() {
        if (!this.needsGeneration) {
            console.log("Skipping generation/bounds calc - not needed.");
            return;
        }
        console.log("--- Starting Generation & Bounds Calculation ---");
        this.generate();
        this.calculateBounds();
        this.needsGeneration = false;
        this.resetAnimation();
        console.log("--- Finished Generation & Bounds Calculation ---");
    }

    generate() { /* ... string generation logic as before ... */ }

    calculateBounds() {
        console.log("Calculating bounds with angle:", this.angle, "length:", this.stepLength);
        const p = this.p; // Need p5 instance for cos/sin that respect angleMode
        let x = 0, y = 0;
        let currentAngle = presets[this.ruleSetKey]?.startAngle || 0; // Start angle in degrees
        let minX = 0, maxX = 0, minY = 0, maxY = 0;
        const stack = [];

        const commands = this.lstring;
        if (!commands) {
            console.warn("Cannot calculate bounds: L-string is empty.");
            this.bounds = { minX: 0, maxX: 1, minY: 0, maxY: 1, calculated: true }; // Avoid division by zero later
            return;
        }

        // Ensure initial point is included in bounds
        minX = Math.min(minX, x); maxX = Math.max(maxX, x);
        minY = Math.min(minY, y); maxY = Math.max(maxY, y);

        for (let i = 0; i < commands.length; i++) {
            const cmd = commands[i];

            if (cmd === 'F' || cmd === 'G') {
                // *** Use currentAngle directly with p.cos/p.sin (assuming DEGREES mode) ***
                const dx = this.stepLength * p.cos(currentAngle);
                const dy = this.stepLength * p.sin(currentAngle);
                x += dx;
                y += dy;
                minX = Math.min(minX, x); maxX = Math.max(maxX, x);
                minY = Math.min(minY, y); maxY = Math.max(maxY, y);
            } else if (cmd === '+') {
                currentAngle -= this.angle;
            } else if (cmd === '-') {
                currentAngle += this.angle;
            } else if (cmd === '[') {
                stack.push({ x, y, angle: currentAngle }); // Save state
            } else if (cmd === ']') {
                if (stack.length > 0) {
                    const state = stack.pop();
                    x = state.x; y = state.y; currentAngle = state.angle;
                }
            }
        }

        // Add a tiny margin if bounds have zero width/height to prevent division by zero
        if (maxX === minX) maxX += 1e-6;
        if (maxY === minY) maxY += 1e-6;

        this.bounds = { minX, maxX, minY, maxY, calculated: true };
        console.log("Bounds calculated:", this.bounds);

        // Calculate Scale and Offset
        const boundsWidth = this.bounds.maxX - this.bounds.minX;
        const boundsHeight = this.bounds.maxY - this.bounds.minY;
        const padding = 0.90;

        // Check for invalid bounds before calculating scale
        if (boundsWidth <= 0 || boundsHeight <= 0 || !isFinite(boundsWidth) || !isFinite(boundsHeight)) {
             console.warn("Invalid bounds dimensions detected. Defaulting scale to 1.", boundsWidth, boundsHeight);
             this.scaleFactor = 1;
        } else {
            let scaleX = (p.width * padding) / boundsWidth;
            let scaleY = (p.height * padding) / boundsHeight;
            this.scaleFactor = Math.min(scaleX, scaleY);
        }


        if (!isFinite(this.scaleFactor) || this.scaleFactor <= 0) {
            console.warn("Invalid scale factor calculated. Defaulting to 1.");
            this.scaleFactor = 1;
        }

        const centerX = (this.bounds.minX + this.bounds.maxX) / 2;
        const centerY = (this.bounds.minY + this.bounds.maxY) / 2;
        this.offsetX = -centerX;
        this.offsetY = -centerY;

        console.log(`Scale: ${this.scaleFactor.toFixed(3)}, Offset: (${this.offsetX.toFixed(2)}, ${this.offsetY.toFixed(2)})`);
    }


    draw(sharedState) {
        const p = this.p;

        // Ensure generation and bounds calculation happens if needed *before* drawing
        if (this.needsGeneration) {
             this.generateAndCalculateBounds();
        }

        // Check if ready to draw
        if (!this.lstring || !this.bounds.calculated) {
            p.push(); p.fill(0,0,80); p.textAlign(p.CENTER); p.textSize(16);
            p.text("Generating / Calculating...", 0, 0); // Center assumes main.js isn't translating
            p.pop(); return;
        }

        // --- Drawing Logic with Scaling ---
        p.push(); // Isolate transforms

        // Apply transformations: Center canvas, Scale, Center bounds, Initial rotation
        p.translate(p.width / 2, p.height / 2);
        p.scale(this.scaleFactor);
        p.translate(this.offsetX, this.offsetY);
        let startAngle = presets[this.ruleSetKey]?.startAngle || 0;
        p.rotate(startAngle); // Assuming angleMode DEGREES

        // Set drawing style - *** Use constant stroke weight for now ***
        p.stroke(120, 80, 90);
        p.strokeWeight(1.5); // Constant weight


        // Determine how much to draw
        const commands = this.lstring;
        let commandsToProcess = commands.length;
        if (sharedState.animate) {
            let stepsPerFrame = Math.ceil(sharedState.speed * (1 + Math.log10(Math.max(1, commands.length))));
            stepsPerFrame = Math.max(1, Math.min(500, stepsPerFrame));
            this.currentIndex = Math.min(this.currentIndex + stepsPerFrame, commands.length);
            commandsToProcess = this.currentIndex;
        }

        // Draw path from start up to commandsToProcess
        for (let i = 0; i < commandsToProcess; i++) {
            const cmd = commands[i];
            if (cmd === 'F') { p.line(0, 0, this.stepLength, 0); p.translate(this.stepLength, 0); }
            else if (cmd === 'G') { p.translate(this.stepLength, 0); }
            else if (cmd === '+') { p.rotate(-this.angle); }
            else if (cmd === '-') { p.rotate(this.angle); }
            else if (cmd === '[') { p.push(); }
            else if (cmd === ']') { p.pop(); }
        }

        p.pop(); // Restore initial drawing state
    }

    // --- Interface Methods ---
    getDisplayName() { return "L-System Generator"; }
    getFormula() { return `Rule: ${this.ruleSetKey}, Iter: ${this.iterations}`; }
    getExplanation() { /* ... explanation HTML string as before ... */ }
    isAnimatable() { return true; }

    activate() { /* ... as before, ensures bounds are calculated ... */
        console.log("L-System activate called.");
        if(this.needsGeneration || !this.bounds.calculated){ this.generateAndCalculateBounds(); }
        this.resetAnimation();
        this.updateControls();
        this.p.redraw();
    }

} // End class LSystemVisualization