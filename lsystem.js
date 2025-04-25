// lsystem.js - Module for L-System Visualization (Simplified DIAGNOSTIC Version)

// Helper for presets
const presets = {
    plant: { axiom: "X", rules: { "X": "F+[[X]-X]-F[-FX]+X", "F": "FF" }, angle: 25, startAngle: -90 },
    koch: { axiom: "F", rules: { "F": "F+F-F-F+F" }, angle: 90, startAngle: 0 },
    dragon: { axiom: "FX", rules: { "X": "X+YF+", "Y": "-FX-Y" }, angle: 90, startAngle: 0 },
};

export default class LSystemVisualization {
    constructor(p, controlsElement) {
        console.log("LSystemVisualization constructor called (Simplified DIAGNOSTIC).");
        this.p = p;
        this.controls = controlsElement;
        // ... rest of constructor setup as before ...
        this.ruleSetKey = 'plant'; this.iterations = 4; this.angle = presets[this.ruleSetKey].angle;
        this.stepLength = 5; this.lstring = ""; this.needsGeneration = true; this.currentIndex = 0;
        this.presetSelect = p.select('#lsystemPreset', this.controls?.elt); this.iterationsSlider = p.select('#lsystemIterations', this.controls?.elt);
        this.iterationsValSpan = p.select('#lsystemIterationsVal', this.controls?.elt); this.angleSlider = p.select('#lsystemAngle', this.controls?.elt);
        this.angleValSpan = p.select('#lsystemAngleVal', this.controls?.elt); this.stepLengthSlider = p.select('#lsystemStepLength', this.controls?.elt);
        this.stepLengthValSpan = p.select('#lsystemStepLengthVal', this.controls?.elt); this.restartBtn = p.select('#restartLSystemBtn', this.controls?.elt);
        this.addListener(this.presetSelect, 'changed', this.updateParams); this.addListener(this.iterationsSlider, 'input', this.updateParams);
        this.addListener(this.angleSlider, 'input', this.updateParams); this.addListener(this.stepLengthSlider, 'input', this.updateParams);
        if (this.restartBtn) { this.restartBtn.mousePressed(() => this.restart()); }
        this.updateControls(); this.generate();
    }

    addListener(element, eventType, handler) { /* ... */ }
    updateParams() { /* ... as before, triggers generate() if needed */ }
    updateControls() { /* ... */ }
    restart() { /* ... */ }
    resetAnimation() { this.currentIndex = 0; }
    generate() { /* ... generation logic as before ... */ }

    draw(sharedState) {
        const p = this.p;
        console.log(`--- LSystem Draw Frame Start (Animate: ${sharedState.animate}) ---`);

        if (this.needsGeneration) {
            console.log("LSystem Draw: Calling generate...");
            this.generate();
        }
        if (!this.lstring) {
            console.log("LSystem Draw: No L-string available.");
            p.push(); p.fill(0,0,80); p.textAlign(p.CENTER); p.textSize(16);
            p.text("Generating L-System...", 0, 0); // Centered via main.js
            p.pop(); return;
        }

        console.log(`LSystem Draw: String length=${this.lstring.length}, StepLength=${this.stepLength}, Angle=${this.angle}`);

        p.push(); // Isolate transforms

        let startAngle = presets[this.ruleSetKey]?.startAngle || 0;
        p.rotate(startAngle);
        console.log(`LSystem Draw: Applied start rotation ${startAngle}`);

        // *** DIAGNOSTIC: Draw a marker at the starting point (0,0 after rotation) ***
        p.fill(0, 100, 100); // Bright Red
        p.noStroke();
        p.ellipse(0, 0, 5, 5); // Draw a small circle at the origin
        console.log("LSystem Draw: Drew origin marker at (0, 0) relative to rotation.");
        // *** END DIAGNOSTIC ***

        // Set drawing style for fractal
        p.stroke(120, 80, 90); // Green
        p.strokeWeight(1.5);
        p.noFill(); // Make sure fill is off

        const commands = this.lstring;
        let commandsToProcess = commands.length;
        if (sharedState.animate) {
             let stepsPerFrame = Math.ceil(sharedState.speed * (1 + Math.log10(Math.max(1, commands.length))));
             stepsPerFrame = Math.max(1, Math.min(500, stepsPerFrame));
             this.currentIndex = Math.min(this.currentIndex + stepsPerFrame, commands.length);
             commandsToProcess = this.currentIndex;
        }
        console.log(`LSystem Draw: Processing ${commandsToProcess} commands.`);

        // Limit logs inside loop to avoid flooding console
        let logCounter = 0;
        const LOG_LIMIT = 10;

        // Draw path from start up to commandsToProcess
        for (let i = 0; i < commandsToProcess; i++) {
            const cmd = commands[i];
            // Log first few commands processed
            if (logCounter < LOG_LIMIT) {
                // console.log(`LSystem Draw Loop [${i}]: Cmd='${cmd}'`);
            }

            if (cmd === 'F') {
                if (logCounter < LOG_LIMIT) console.log(`  -> Draw Line: len=${this.stepLength}`);
                p.line(0, 0, this.stepLength, 0);
                p.translate(this.stepLength, 0);
            } else if (cmd === 'G') {
                 if (logCounter < LOG_LIMIT) console.log(`  -> Move: len=${this.stepLength}`);
                 p.translate(this.stepLength, 0);
            } else if (cmd === '+') {
                 if (logCounter < LOG_LIMIT) console.log(`  -> Rotate: -${this.angle}`);
                 p.rotate(-this.angle);
            } else if (cmd === '-') {
                 if (logCounter < LOG_LIMIT) console.log(`  -> Rotate: +${this.angle}`);
                 p.rotate(this.angle);
            } else if (cmd === '[') {
                 if (logCounter < LOG_LIMIT) console.log("  -> Push");
                 p.push();
            } else if (cmd === ']') {
                 if (logCounter < LOG_LIMIT) console.log("  -> Pop");
                 p.pop();
            }
            logCounter++;
        }

        p.pop(); // Restore initial drawing state
        console.log(`--- LSystem Draw Frame End ---`);
    }

    // --- Interface Methods ---
    getDisplayName() { return "L-System Generator"; }
    getFormula() { return `Rule: ${this.ruleSetKey}, Iter: ${this.iterations}`; }
    getExplanation() { /* ... explanation HTML string as before ... */ }
    isAnimatable() { return true; }
    activate() { /* ... as before ... */ }

} // End class LSystemVisualization