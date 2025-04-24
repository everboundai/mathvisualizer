// lsystem.js - Module for L-System Visualization

// Helper for presets
const presets = {
    plant: { axiom: "X", rules: { X: "F+[[X]-X]-F[-FX]+X", F: "FF" }, angle: 25, startAngle: -90, initialTranslateY: 0.45, lenShrink: 1 },
    koch: { axiom: "F", rules: { F: "F+F-F-F+F" }, angle: 90, startAngle: 0, initialTranslateY: 0.3, lenShrink: 3 },
    dragon: { axiom: "FX", rules: { X: "X+YF+", Y: "-FX-Y" }, angle: 90, startAngle: 0, initialTranslateY: 0, lenShrink: 1.5 }
};
function gcd(a, b) { return b === 0 ? a : gcd(b, Math.abs(a % b)); } // Keep helper just in case

export default class LSystemVisualization {
    constructor(p, controlsElement) {
        this.p = p; this.controls = controlsElement;
        if (!this.controls) console.error("LSystem controls div not passed correctly!");
        this.ruleSetKey = 'plant'; this.iterations = 4; this.angle = presets[this.ruleSetKey].angle; this.stepLength = 5;
        this.lstring = ""; this.needsGeneration = true; this.currentIndex = 0;
        this.presetSelect = p.select('#lsystemPreset', this.controls?.elt);
        this.iterationsSlider = p.select('#lsystemIterations', this.controls?.elt); this.iterationsValSpan = p.select('#lsystemIterationsVal', this.controls?.elt);
        this.angleSlider = p.select('#lsystemAngle', this.controls?.elt); this.angleValSpan = p.select('#lsystemAngleVal', this.controls?.elt);
        this.stepLengthSlider = p.select('#lsystemStepLength', this.controls?.elt); this.stepLengthValSpan = p.select('#lsystemStepLengthVal', this.controls?.elt);
        this.restartBtn = p.select('#restartLSystemBtn', this.controls?.elt);
        this.addListener(this.presetSelect, 'changed'); this.addListener(this.iterationsSlider, 'input');
        this.addListener(this.angleSlider, 'input'); this.addListener(this.stepLengthSlider, 'input');
        if (this.restartBtn) { this.restartBtn.mousePressed(() => this.restart()); }
        this.updateControls(); this.generate();
    }
    addListener(element, eventType) { if (element) { element[eventType](() => this.updateParams()); } else { console.warn("LSystem listener element not found for", eventType); } }
    updateParams() {
        let presetChanged = false; let needsRegen = false;
        if (this.presetSelect) { let newPresetKey = this.presetSelect.value(); if (newPresetKey !== this.ruleSetKey && presets[newPresetKey]) { this.ruleSetKey = newPresetKey; this.angle = presets[this.ruleSetKey].angle; presetChanged = true; needsRegen = true; console.log("Preset changed:", this.ruleSetKey, "Angle:", this.angle); } }
        if (this.iterationsSlider) { let newIterations = parseInt(this.iterationsSlider.value()); if (newIterations !== this.iterations) { this.iterations = newIterations; needsRegen = true; } if (this.iterationsValSpan) this.iterationsValSpan.html(this.iterations); }
        if (this.angleSlider) { if (presetChanged) { this.angleSlider.value(this.angle); } else { let newAngle = parseFloat(this.angleSlider.value()); if (newAngle !== this.angle) { this.angle = newAngle; } } if (this.angleValSpan) this.angleValSpan.html(this.angle.toFixed(0)); }
        if (this.stepLengthSlider) { let newLength = parseFloat(this.stepLengthSlider.value()); if (newLength !== this.stepLength) { this.stepLength = newLength; } if (this.stepLengthValSpan) this.stepLengthValSpan.html(this.stepLength.toFixed(0)); }
        if (needsRegen) { this.needsGeneration = true; this.resetAnimation(); }
        this.p.redraw();
    }
    updateControls() { if (this.iterationsSlider) this.iterationsSlider.value(this.iterations); if (this.iterationsValSpan) this.iterationsValSpan.html(this.iterations); if (this.angleSlider) this.angleSlider.value(this.angle); if (this.angleValSpan) this.angleValSpan.html(this.angle.toFixed(0)); if (this.stepLengthSlider) this.stepLengthSlider.value(this.stepLength); if (this.stepLengthValSpan) this.stepLengthValSpan.html(this.stepLength.toFixed(0)); if (this.presetSelect) this.presetSelect.value(this.ruleSetKey); }
    restart() { console.log("Regenerating/Restarting L-System"); this.needsGeneration = true; this.resetAnimation(); this.p.redraw(); }
    resetAnimation() { this.currentIndex = 0; }
    generate() {
        console.log(`Generating L-System: ${this.ruleSetKey}, Iterations: ${this.iterations}`); const preset = presets[this.ruleSetKey]; if (!preset) { console.error("Invalid preset key:", this.ruleSetKey); this.lstring = ""; this.needsGeneration = false; return; }
        let current = preset.axiom;
        for (let i = 0; i < this.iterations; i++) { let next = ""; for (let char of current) { next += preset.rules[char] || char; } current = next; if (current.length > 500000) { console.warn("L-System length limit exceeded", i+1); this.iterations = i + 1; this.updateControls(); break; } }
        this.lstring = current; this.needsGeneration = false; this.resetAnimation(); console.log("L-System generated. Length:", this.lstring.length);
    }
    draw(sharedState) {
        const p = this.p; if (this.needsGeneration) { this.generate(); } if (!this.lstring) return;
        p.push();
        const preset = presets[this.ruleSetKey] || presets.plant;
        // *** Define start position/angle BEFORE using them ***
        let startX = 0; let startY = p.height * preset.initialTranslateY; let startAngle = preset.startAngle;
        p.translate(startX, startY); p.rotate(startAngle); // Use calculated start state
        p.stroke(0, 0, 100); p.strokeWeight(1);
        let drawToIndex; let effectiveLength = this.stepLength;
        if (preset.lenShrink && preset.lenShrink > 1) { effectiveLength /= (preset.lenShrink ** this.iterations); } effectiveLength = Math.max(0.5, effectiveLength);
        if (sharedState.animate) { let segmentsPerFrame = Math.max(1, Math.floor(sharedState.speed * 10 * (this.lstring.length / 10000))); this.currentIndex = Math.min(this.currentIndex + segmentsPerFrame, this.lstring.length); drawToIndex = this.currentIndex; }
        else { drawToIndex = this.lstring.length; if (this.currentIndex !== this.lstring.length) { this.currentIndex = 0; } }
        for (let i = 0; i < drawToIndex; i++) {
            let char = this.lstring[i];
            switch (char) {
                case 'F': case 'G': p.line(0, 0, 0, -effectiveLength); p.translate(0, -effectiveLength); break;
                case 'f': p.translate(0, -effectiveLength); break;
                case '+': p.rotate(-this.angle); break;
                case '-': p.rotate(this.angle); break;
                case '[': p.push(); break;
                case ']': p.pop(); break;
            }
        } p.pop();
    }
    getDisplayName() { return "L-System Generator"; }
    getFormula() { return formulas['lsystem']; } // Use main map
    getExplanation() { return explanations['lsystem']; } // Use main map
    isAnimatable() { return true; } // L-System can animate
    showControls() { if (this.controls) this.controls.addClass('active'); }
    hideControls() { if (this.controls) this.controls.removeClass('active'); }
    activate() { this.needsGeneration = true; this.resetAnimation(); this.p.redraw(); }
} // End class LSystemVisualization