// lsystem.js - Module for L-System Visualization

// Helper for presets
const presets = { /* ... (presets object identical) ... */ };
function gcd(a, b) { /* ... (gcd identical) ... */ }

export default class LSystemVisualization {
    constructor(p, controlsElement) {
        this.p = p;
        this.controls = controlsElement;
        if (!this.controls) console.error("LSystem controls div not passed correctly!");

        // State
        this.ruleSetKey = 'plant'; this.iterations = 4; this.angle = presets[this.ruleSetKey].angle; this.stepLength = 5;
        this.lstring = ""; this.needsGeneration = true;
        this.currentIndex = 0; // Animation state

        // Get specific controls
        this.presetSelect = p.select('#lsystemPreset', this.controls?.elt);
        this.iterationsSlider = p.select('#lsystemIterations', this.controls?.elt); this.iterationsValSpan = p.select('#lsystemIterationsVal', this.controls?.elt);
        this.angleSlider = p.select('#lsystemAngle', this.controls?.elt); this.angleValSpan = p.select('#lsystemAngleVal', this.controls?.elt);
        this.stepLengthSlider = p.select('#lsystemStepLength', this.controls?.elt); this.stepLengthValSpan = p.select('#lsystemStepLengthVal', this.controls?.elt);
        // *** Select correct button ID ***
        this.restartBtn = p.select('#restartLSystemBtn', this.controls?.elt);

        // Attach listeners
        this.addListener(this.presetSelect, 'changed');
        this.addListener(this.iterationsSlider, 'input');
        this.addListener(this.angleSlider, 'input');
        this.addListener(this.stepLengthSlider, 'input');
        // *** Attach listener to correct button ***
        if (this.restartBtn) {
            this.restartBtn.mousePressed(() => this.restart());
            console.log("L-System Restart button listener attached.");
        } else {
            console.warn("Restart L-System Button (#restartLSystemBtn) not found within #lsystemControls");
        }

        this.updateControls();
        this.generate();
    }

    addListener(element, eventType) { /* ... (Identical) ... */ }
    updateParams() { /* ... (Identical - Reads sliders, sets needsGeneration flag) ... */
        let presetChanged = false; let needsRegen = false;
        if (this.presetSelect) { let newPresetKey = this.presetSelect.value(); if (newPresetKey !== this.ruleSetKey && presets[newPresetKey]) { this.ruleSetKey = newPresetKey; this.angle = presets[this.ruleSetKey].angle; presetChanged = true; needsRegen = true; } }
        if (this.iterationsSlider) { let newIterations = parseInt(this.iterationsSlider.value()); if (newIterations !== this.iterations) { this.iterations = newIterations; needsRegen = true; } if (this.iterationsValSpan) this.iterationsValSpan.html(this.iterations); }
        if (this.angleSlider) { if (presetChanged) { this.angleSlider.value(this.angle); } else { let newAngle = parseFloat(this.angleSlider.value()); if (newAngle !== this.angle) { this.angle = newAngle; } } if (this.angleValSpan) this.angleValSpan.html(this.angle.toFixed(0)); }
        if (this.stepLengthSlider) { let newLength = parseFloat(this.stepLengthSlider.value()); if (newLength !== this.stepLength) { this.stepLength = newLength; } if (this.stepLengthValSpan) this.stepLengthValSpan.html(this.stepLength.toFixed(0)); }
        if (needsRegen) { this.needsGeneration = true; this.resetAnimation(); } else { this.p.redraw(); } // Redraw only if not regenerating (regen triggers redraw)
    }
    updateControls() { /* ... (Identical - Updates slider visuals from state) ... */ }
    restart() { /* ... (Identical - flags regen & resets animation) ... */ }
    resetAnimation() { this.currentIndex = 0; }
    generate() { /* ... (Identical - generates lstring) ... */ }
    draw(sharedState) { /* ... (Identical - draws turtle based on animate state) ... */ }
    getDisplayName() { return "L-System Generator"; }
    getFormula() { return formulas['lsystem']; }
    getExplanation() { return explanations['lsystem']; }
    isAnimatable() { return true; }
    showControls() { if (this.controls) this.controls.addClass('active'); }
    hideControls() { if (this.controls) this.controls.removeClass('active'); }
    activate() { this.needsGeneration = true; this.resetAnimation(); this.p.redraw(); }

} // End class LSystemVisualization