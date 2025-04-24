// lsystem.js - Module for L-System Visualization

// Helper for presets
const presets = {
    plant: {
        axiom: "X",
        rules: {
            X: "F+[[X]-X]-F[-FX]+X", // A complex plant-like structure rule
            F: "FF"
        },
        angle: 25, // Suggested angle
        startAngle: -90, // Start pointing up
        initialTranslateY: 0.45 // Start near bottom center (fraction of height)
    },
    koch: {
        axiom: "F",
        rules: { F: "F+F-F-F+F" },
        angle: 90,
        startAngle: 0, // Start pointing right
        initialTranslateY: 0 // Center vertically? Or slightly up?
    },
    dragon: {
        axiom: "FX",
        rules: { X: "X+YF+", Y: "-FX-Y" },
        angle: 90,
        startAngle: 0, // Start pointing right
        initialTranslateY: 0 // Center
    }
    // Add more presets here
};

export default class LSystemVisualization {
    constructor(p, controlsElement) {
        this.p = p;
        this.controls = controlsElement;

        // State
        this.ruleSetKey = 'plant'; // Default preset key
        this.iterations = 4;
        this.angle = presets[this.ruleSetKey].angle; // Start with preset angle
        this.stepLength = 5;
        this.lstring = ""; // The generated L-system string
        this.needsGeneration = true; // Flag to regenerate the string

        // Animation State
        this.currentIndex = 0; // How many steps have been drawn in animation
        this.segmentsPerFrame = 5; // Initial value, linked to speed later

        // Get specific controls
        this.presetSelect = p.select('#lsystemPreset', this.controls?.elt);
        this.iterationsSlider = p.select('#lsystemIterations', this.controls?.elt); this.iterationsValSpan = p.select('#lsystemIterationsVal', this.controls?.elt);
        this.angleSlider = p.select('#lsystemAngle', this.controls?.elt); this.angleValSpan = p.select('#lsystemAngleVal', this.controls?.elt);
        this.stepLengthSlider = p.select('#lsystemStepLength', this.controls?.elt); this.stepLengthValSpan = p.select('#lsystemStepLengthVal', this.controls?.elt);
        this.restartBtn = p.select('#restartLSystemBtn', this.controls?.elt);

        // Attach listeners
        this.addListener(this.presetSelect, 'changed'); // Use 'changed' for select dropdown
        this.addListener(this.iterationsSlider, 'input');
        this.addListener(this.angleSlider, 'input');
        this.addListener(this.stepLengthSlider, 'input');
        if (this.restartBtn) { this.restartBtn.mousePressed(() => this.restart()); }

        // Initialize controls and generate initial string
        this.updateControls(); // Set initial slider values/displays based on state
        this.generate(); // Generate the first time
    }

    addListener(element, eventType) {
        if (element) { element[eventType](() => this.updateParams()); }
        else { console.warn("LSystem listener element not found"); }
    }

    updateParams() {
        let presetChanged = false;
        let needsRegen = false;

        // Read Preset
        if (this.presetSelect) {
            let newPresetKey = this.presetSelect.value();
            if (newPresetKey !== this.ruleSetKey) {
                this.ruleSetKey = newPresetKey;
                // Update angle to preset's default when preset changes
                this.angle = presets[this.ruleSetKey]?.angle || this.angle; // Use preset angle
                presetChanged = true; // Flag to update angle slider visually
                needsRegen = true;
                console.log("Preset changed to:", this.ruleSetKey, "Setting angle to:", this.angle);
            }
        }

        // Read Iterations
        if (this.iterationsSlider) {
            let newIterations = parseInt(this.iterationsSlider.value());
            if (newIterations !== this.iterations) {
                this.iterations = newIterations;
                needsRegen = true;
            }
            if (this.iterationsValSpan) this.iterationsValSpan.html(this.iterations);
        }

        // Read Angle (allow override)
        if (this.angleSlider) {
            // If preset changed, update slider to match new default angle
            if (presetChanged) {
                this.angleSlider.value(this.angle);
            } else { // Otherwise, read slider value
                let newAngle = parseFloat(this.angleSlider.value());
                 if (newAngle !== this.angle) {
                     this.angle = newAngle;
                     // Angle change doesn't require string regeneration, only redraw
                 }
            }
             if (this.angleValSpan) this.angleValSpan.html(this.angle.toFixed(0));
        }

        // Read Step Length
        if (this.stepLengthSlider) {
            let newLength = parseFloat(this.stepLengthSlider.value());
             if (newLength !== this.stepLength) {
                 this.stepLength = newLength;
                 // Length change doesn't require regeneration, only redraw
             }
             if (this.stepLengthValSpan) this.stepLengthValSpan.html(this.stepLength.toFixed(0));
        }

        // Trigger regeneration if needed
        if (needsRegen) {
            this.needsGeneration = true;
            this.resetAnimation(); // Reset animation when regenerating string
        }

        this.p.redraw();
    }

    // Update slider values based on internal state (useful after preset change)
    updateControls() {
         if (this.iterationsSlider) this.iterationsSlider.value(this.iterations); if (this.iterationsValSpan) this.iterationsValSpan.html(this.iterations);
         if (this.angleSlider) this.angleSlider.value(this.angle); if (this.angleValSpan) this.angleValSpan.html(this.angle.toFixed(0));
         if (this.stepLengthSlider) this.stepLengthSlider.value(this.stepLength); if (this.stepLengthValSpan) this.stepLengthValSpan.html(this.stepLength.toFixed(0));
         if (this.presetSelect) this.presetSelect.value(this.ruleSetKey);
    }


    restart() {
        console.log("Regenerating/Restarting L-System");
        this.needsGeneration = true; // Force regeneration
        this.resetAnimation(); // Reset drawing index
        this.p.redraw();
    }

    resetAnimation() {
        this.currentIndex = 0; // Reset drawing progress for animation
    }

    generate() {
        console.log("Generating L-System string...");
        const preset = presets[this.ruleSetKey];
        if (!preset) {
            console.error("Invalid preset key:", this.ruleSetKey);
            this.lstring = "";
            this.needsGeneration = false;
            return;
        }

        let current = preset.axiom;
        for (let i = 0; i < this.iterations; i++) {
            let next = "";
            for (let char of current) {
                next += preset.rules[char] || char; // Apply rule or keep character
            }
            current = next;
             // Optional: Limit string length to prevent browser freezing
             if (current.length > 500000) {
                 console.warn("L-System string length limit exceeded at iteration", i+1);
                 this.iterations = i + 1; // Adjust iteration count state
                 if(this.iterationsSlider) this.iterationsSlider.value(this.iterations); // Update slider
                 if(this.iterationsValSpan) this.iterationsValSpan.html(this.iterations);
                 break;
             }
        }
        this.lstring = current;
        this.needsGeneration = false;
        this.resetAnimation(); // Reset animation index after generating
        console.log("L-System generated. Length:", this.lstring.length);
    }

    draw(sharedState) {
        const p = this.p;

        if (this.needsGeneration) {
            this.generate();
        }

        p.push(); // Isolate transforms and styles

        // Set starting position and angle based on preset
        const preset = presets[this.ruleSetKey] || presets.plant; // Fallback to plant
        let startX = 0; // Center X (since origin is already translated)
        let startY = p.height * preset.initialTranslateY; // Start near bottom center
        let startAngle = preset.startAngle;

        p.translate(startX, startY); // Move turtle start position
        p.rotate(startAngle); // Set initial turtle angle

        p.stroke(0, 0, 100); // White lines
        p.strokeWeight(1);
        let stack = []; // For push/pop state [ and ]

        // Determine how much of the string to draw
        let drawToIndex;
        if (sharedState.animate) {
             // Increase index based on speed, ensuring at least 1 step if speed > 0
            let stepsPerFrame = Math.max(1, Math.floor(sharedState.speed * (this.lstring.length / 300))); // Scale speed based on string length? Adjust multiplier
             this.currentIndex = Math.min(this.currentIndex + stepsPerFrame, this.lstring.length);
             drawToIndex = this.currentIndex;
        } else {
             drawToIndex = this.lstring.length; // Draw everything if not animating
             // Ensure animation index is reset if we switch back
             this.currentIndex = this.lstring.length;
        }

        // --- Turtle Graphics Interpretation ---
        let currentLength = this.stepLength; // Might adjust based on stack depth later

        for (let i = 0; i < drawToIndex; i++) {
            let char = this.lstring[i];

            switch (char) {
                case 'F': // Draw forward
                case 'G': // Also draw forward (common alternative)
                    p.line(0, 0, 0, -currentLength);
                    p.translate(0, -currentLength);
                    break;
                case 'f': // Move forward without drawing
                    p.translate(0, -currentLength);
                    break;
                case '+': // Turn left
                    p.rotate(-this.angle);
                    break;
                case '-': // Turn right
                    p.rotate(this.angle);
                    break;
                case '[': // Push current state
                    p.push();
                    break;
                case ']': // Pop state
                    p.pop();
                    break;
                // Add other rules if needed (e.g., for color changes 'C', etc.)
            }
        }

        p.pop(); // Restore initial transform state
    }

    // --- Interface Methods ---
    getDisplayName() { return "L-System Generator"; }
    getFormula() { return `L-System Turtle Graphics`; } // Static for now
    getExplanation() { return `<h3>L-System Generator</h3><p>L-Systems...</p><ul>...</ul><p>When animated...</p>`; } // Keep full text
    isAnimatable() { return true; }

    showControls() { if (this.controls) this.controls.addClass('active'); }
    hideControls() { if (this.controls) this.controls.removeClass('active'); }
    activate() { this.needsGeneration = true; this.resetAnimation(); this.p.redraw(); }

} // End class LSystemVisualization