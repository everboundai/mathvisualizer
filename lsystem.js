// lsystem.js - Module for L-System Visualization (Simplified for Diagnostics)

// Helper for presets
const presets = {
    plant: { axiom: "X", rules: { "X": "F+[[X]-X]-F[-FX]+X", "F": "FF" }, angle: 25, startAngle: -90 },
    koch: { axiom: "F", rules: { "F": "F+F-F-F+F" }, angle: 90, startAngle: 0 },
    dragon: { axiom: "FX", rules: { "X": "X+YF+", "Y": "-FX-Y" }, angle: 90, startAngle: 0 },
};

export default class LSystemVisualization {
    constructor(p, controlsElement) {
        console.log("LSystemVisualization constructor called (Simplified).");
        this.p = p;
        this.controls = controlsElement;
        if (!this.controls) console.error("LSystem controls div not passed correctly!");

        // State
        this.ruleSetKey = 'plant';
        this.iterations = 4;
        this.angle = presets[this.ruleSetKey].angle;
        this.stepLength = 5; // Use direct step length
        this.lstring = "";
        this.needsGeneration = true;
        this.currentIndex = 0;

        // Get specific controls... (as before)
        this.presetSelect = p.select('#lsystemPreset', this.controls?.elt);
        this.iterationsSlider = p.select('#lsystemIterations', this.controls?.elt);
        this.iterationsValSpan = p.select('#lsystemIterationsVal', this.controls?.elt);
        this.angleSlider = p.select('#lsystemAngle', this.controls?.elt);
        this.angleValSpan = p.select('#lsystemAngleVal', this.controls?.elt);
        this.stepLengthSlider = p.select('#lsystemStepLength', this.controls?.elt);
        this.stepLengthValSpan = p.select('#lsystemStepLengthVal', this.controls?.elt);
        this.restartBtn = p.select('#restartLSystemBtn', this.controls?.elt);

        // Attach listeners... (as before)
        this.addListener(this.presetSelect, 'changed', this.updateParams);
        this.addListener(this.iterationsSlider, 'input', this.updateParams);
        this.addListener(this.angleSlider, 'input', this.updateParams);
        this.addListener(this.stepLengthSlider, 'input', this.updateParams);
        if (this.restartBtn) { this.restartBtn.mousePressed(() => this.restart()); }

        // Initial setup
        this.updateControls();
        this.generate(); // Just generate, no bounds calculation
    }

    addListener(element, eventType, handler) { /* ... as before ... */ }

    updateParams() {
        let presetChanged = false;
        let needsRegen = false;
        let logReason = "";

        // Read controls and set needsGeneration flag if geometry changes
        if (this.presetSelect) { let key = this.presetSelect.value(); if (key !== this.ruleSetKey && presets[key]) { this.ruleSetKey = key; this.angle = presets[key].angle; presetChanged = true; needsRegen = true; logReason += "Preset. "; } }
        if (this.iterationsSlider) { let iter = parseInt(this.iterationsSlider.value()); if (iter !== this.iterations) { this.iterations = iter; needsRegen = true; logReason += "Iter. "; } if (this.iterationsValSpan) this.iterationsValSpan.html(this.iterations); }
        if (this.angleSlider) { if (presetChanged) { this.angleSlider.value(this.angle); } let ang = parseFloat(this.angleSlider.value()); if (ang !== this.angle) { this.angle = ang; needsRegen = false; /* Angle change alone redraws */ } if (this.angleValSpan) this.angleValSpan.html(this.angle.toFixed(0)); }
        if (this.stepLengthSlider) { let len = parseFloat(this.stepLengthSlider.value()); if (len !== this.stepLength) { this.stepLength = len; needsRegen = false; /* Length change alone redraws */ } if (this.stepLengthValSpan) this.stepLengthValSpan.html(this.stepLength.toFixed(0)); }

        if (needsRegen) {
            console.log("Flagging generation due to:", logReason);
            this.needsGeneration = true;
            this.resetAnimation();
        }
        // Always redraw if params change in any way
        this.p.redraw();
    }

    updateControls() { /* ... as before ... */ }
    restart() { /* ... as before ... */ }
    resetAnimation() { this.currentIndex = 0; }

    // Only generates the string, no bounds calculation
    generate() {
        if (!this.needsGeneration) return;
        console.log("--- Generating L-System String Only ---");
        const ruleset = presets[this.ruleSetKey];
        if (!ruleset) { console.error("Invalid L-System preset key:", this.ruleSetKey); this.lstring = ""; this.needsGeneration = false; return; }
        this.lstring = ruleset.axiom;
        try { /* ... generation loop as before ... */
            for (let i = 0; i < this.iterations; i++) {
                let nextString = ""; for (let char of this.lstring) { nextString += ruleset.rules[char] || char; }
                this.lstring = nextString;
                if (this.lstring.length > 300000) { console.warn(`L-System string limit exceeded.`); this.iterations = i + 1; this.updateControls(); break; }
            }
        } catch (e) { console.error("Error generating L-System string:", e); this.lstring = ruleset.axiom; }
        console.log("--- Finished Generation ---");
        this.needsGeneration = false;
        this.resetAnimation();
    }

    // Removed calculateBounds()

    draw(sharedState) {
        const p = this.p;

        if (this.needsGeneration) { this.generate(); } // Generate if needed
        if (!this.lstring) { /* ... loading text ... */ return; }

        // --- Drawing Logic (Simplified - No Scaling/Offset) ---
        p.push(); // Isolate transforms

        // Apply the initial rotation for the preset
        // This happens *after* the main translate(w/2, h/2) applied by main.js
        let startAngle = presets[this.ruleSetKey]?.startAngle || 0;
        p.rotate(startAngle); // Assuming angleMode DEGREES

        // Set drawing style
        p.stroke(120, 80, 90); // Green
        p.strokeWeight(1.5); // Constant weight

        // Determine how much to draw (Animation logic)
        const commands = this.lstring;
        let commandsToProcess = commands.length;
        if (sharedState.animate) { /* ... animation index calculation as before ... */
             let stepsPerFrame = Math.ceil(sharedState.speed * (1 + Math.log10(Math.max(1, commands.length))));
             stepsPerFrame = Math.max(1, Math.min(500, stepsPerFrame));
             this.currentIndex = Math.min(this.currentIndex + stepsPerFrame, commands.length);
             commandsToProcess = this.currentIndex;
        }

        // Draw path from start up to commandsToProcess using simple turtle commands
        for (let i = 0; i < commandsToProcess; i++) {
            const cmd = commands[i];
            if (cmd === 'F') { p.line(0, 0, this.stepLength, 0); p.translate(this.stepLength, 0); }
            else if (cmd === 'G') { p.translate(this.stepLength, 0); }
            else if (cmd === '+') { p.rotate(-this.angle); }
            else if (cmd === '-') { p.rotate(this.angle); }
            else if (cmd === '[') { p.push(); }
            else if (cmd === ']') { p.pop(); }
        }

        p.pop(); // Restore initial drawing state (before this module's rotate)
    }

    // --- Interface Methods ---
    getDisplayName() { return "L-System Generator"; }
    getFormula() { return `Rule: ${this.ruleSetKey}, Iter: ${this.iterations}`; }
    getExplanation() { /* ... explanation HTML string as before ... */ }
    isAnimatable() { return true; }
    activate() { /* ... as before ... */ }

} // End class LSystemVisualization