# Creates the updated lsystem.js file with corrected animation logic
lsystem_js_content = r"""
// lsystem.js - Module for L-System Visualization

// Helper for presets (Assume presets object is correctly defined above this)
const presets = {
    plant: {
        axiom: "X",
        rules: { "X": "F+[[X]-X]-F[-FX]+X", "F": "FF" },
        angle: 25,
        startAngle: -90 // Example starting angle correction
    },
    koch: {
        axiom: "F",
        rules: { "F": "F+F-F-F+F" },
        angle: 90,
        startAngle: 0
    },
    dragon: {
        axiom: "FX",
        rules: { "X": "X+YF+", "Y": "-FX-Y" },
        angle: 90,
        startAngle: 0
    },
    // Add other presets if needed
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
        this.currentIndex = 0; // Animation progress index

        // Get specific controls
        this.presetSelect = p.select('#lsystemPreset', this.controls?.elt);
        this.iterationsSlider = p.select('#lsystemIterations', this.controls?.elt);
        this.iterationsValSpan = p.select('#lsystemIterationsVal', this.controls?.elt);
        this.angleSlider = p.select('#lsystemAngle', this.controls?.elt);
        this.angleValSpan = p.select('#lsystemAngleVal', this.controls?.elt);
        this.stepLengthSlider = p.select('#lsystemStepLength', this.controls?.elt);
        this.stepLengthValSpan = p.select('#lsystemStepLengthVal', this.controls?.elt);
        this.restartBtn = p.select('#restartLSystemBtn', this.controls?.elt);

        // Attach listeners
        this.addListener(this.presetSelect, 'changed', this.updateParams);
        this.addListener(this.iterationsSlider, 'input', this.updateParams);
        this.addListener(this.angleSlider, 'input', this.updateParams);
        this.addListener(this.stepLengthSlider, 'input', this.updateParams);

        if (this.restartBtn) {
            this.restartBtn.mousePressed(() => this.restart());
            console.log("L-System Regenerate button listener attached.");
        } else {
            console.warn("Restart L-System Button (#restartLSystemBtn) not found within #lsystemControls");
        }

        // Initial setup
        this.updateControls();
        this.generate();
    }

    // Helper to add listener and bind 'this' correctly
    addListener(element, eventType, handler) {
        if (element) {
            element[eventType](() => handler.call(this));
        } else {
             console.warn(`L-System control element not found during listener attachment.`);
        }
    }

    updateParams() {
        let presetChanged = false;
        let needsRegen = false;

        if (this.presetSelect) {
            let newPresetKey = this.presetSelect.value();
            if (newPresetKey !== this.ruleSetKey && presets[newPresetKey]) {
                this.ruleSetKey = newPresetKey;
                this.angle = presets[this.ruleSetKey].angle;
                presetChanged = true; needsRegen = true;
                console.log("L-System Preset changed to:", this.ruleSetKey);
            }
        }
        if (this.iterationsSlider) {
            let newIterations = parseInt(this.iterationsSlider.value());
            if (newIterations !== this.iterations) {
                this.iterations = newIterations; needsRegen = true;
            }
            if (this.iterationsValSpan) this.iterationsValSpan.html(this.iterations);
        }
        if (this.angleSlider) {
            if (presetChanged) { this.angleSlider.value(this.angle); }
            else {
                let newAngle = parseFloat(this.angleSlider.value());
                if (newAngle !== this.angle) { this.angle = newAngle; }
            }
            if (this.angleValSpan) this.angleValSpan.html(this.angle.toFixed(0));
        }
        if (this.stepLengthSlider) {
            let newLength = parseFloat(this.stepLengthSlider.value());
            if (newLength !== this.stepLength) { this.stepLength = newLength; }
            if (this.stepLengthValSpan) this.stepLengthValSpan.html(this.stepLength.toFixed(0));
        }

        if (needsRegen) {
            this.needsGeneration = true; this.resetAnimation(); this.p.redraw();
            console.log("L-System flagged for regeneration.");
        } else { this.p.redraw(); } // Redraw if only angle/length changed
    }

    updateControls() {
        console.log("Updating L-System controls to match state.");
        if (this.presetSelect) this.presetSelect.value(this.ruleSetKey);
        if (this.iterationsSlider) this.iterationsSlider.value(this.iterations);
        if (this.iterationsValSpan) this.iterationsValSpan.html(this.iterations);
        if (this.angleSlider) this.angleSlider.value(this.angle);
        if (this.angleValSpan) this.angleValSpan.html(this.angle.toFixed(0));
        if (this.stepLengthSlider) this.stepLengthSlider.value(this.stepLength);
        if (this.stepLengthValSpan) this.stepLengthValSpan.html(this.stepLength.toFixed(0));
    }

    restart() {
        console.log("L-System Restart (Regenerate) called.");
        this.needsGeneration = true; this.resetAnimation();
        this.p.redraw();
    }

    resetAnimation() {
        this.currentIndex = 0;
        // drawingStack is implicitly reset by push/pop in draw
    }

    generate() {
        console.log(`Generating L-System: ${this.ruleSetKey}, Iterations: ${this.iterations}`);
        const ruleset = presets[this.ruleSetKey];
        if (!ruleset) {
            console.error("Invalid L-System preset key:", this.ruleSetKey);
            this.lstring = ""; this.needsGeneration = false; return;
        }

        this.lstring = ruleset.axiom;
        try {
            for (let i = 0; i < this.iterations; i++) {
                let nextString = "";
                for (let char of this.lstring) {
                    nextString += ruleset.rules[char] || char;
                }
                this.lstring = nextString;
                if (this.lstring.length > 300000) {
                    console.warn(`L-System string length exceeded limit (${this.lstring.length}). Stopping generation.`);
                    this.iterations = i + 1;
                    if (this.iterationsSlider) this.iterationsSlider.value(this.iterations);
                    if (this.iterationsValSpan) this.iterationsValSpan.html(this.iterations);
                    break;
                }
            }
            console.log("L-System generation complete. String length:", this.lstring.length);
        } catch (e) {
            console.error("Error during L-System string generation:", e);
            this.lstring = ruleset.axiom; // Reset to axiom on error
        }
        this.needsGeneration = false;
        this.resetAnimation();
    }

    draw(sharedState) {
        const p = this.p;

        if (this.needsGeneration) { this.generate(); }

        if (!this.lstring) {
            p.push(); p.fill(0,0,80); p.textAlign(p.CENTER); p.textSize(16);
            p.text("Generating L-System...", 0, 0); p.pop(); return;
        }

        // --- Drawing Logic ---
        p.push(); // Isolate transforms and styles for this drawing

        p.stroke(120, 80, 90); p.strokeWeight(1.5);

        // Apply starting angle correction from preset if available
        // This needs to be applied *every frame* because transforms are reset by push/pop
        let startAngle = presets[this.ruleSetKey]?.startAngle || 0;
        p.rotate(startAngle);

        const commands = this.lstring;
        let commandsToProcess = commands.length; // Default to drawing everything

        if (sharedState.animate) {
            // Determine how many steps to draw this frame
            // Increase steps drawn per frame based on speed and total length for faster animation
            let stepsPerFrame = Math.ceil(sharedState.speed * (1 + Math.log10(Math.max(1, commands.length)))); // logarithmic scaling
            stepsPerFrame = Math.max(1, stepsPerFrame); // Ensure at least 1 step
            this.currentIndex = Math.min(this.currentIndex + stepsPerFrame, commands.length);
            commandsToProcess = this.currentIndex; // Only process commands up to the current index
        }

        // *** Always draw from the beginning up to 'commandsToProcess' ***
        for (let i = 0; i < commandsToProcess; i++) {
            const cmd = commands[i];

            if (cmd === 'F' || cmd === 'G') {
                // Draw line for 'F', just move for 'G'
                if (cmd === 'F') { p.line(0, 0, this.stepLength, 0); }
                p.translate(this.stepLength, 0);
            } else if (cmd === '+') {
                p.rotate(-this.angle); // Assuming angleMode is DEGREES (set globally)
            } else if (cmd === '-') {
                p.rotate(this.angle); // Assuming angleMode is DEGREES
            } else if (cmd === '[') {
                p.push(); // Save current transform state
            } else if (cmd === ']') {
                p.pop(); // Restore previous transform state
            }
            // Ignore other characters
        }

        p.pop(); // Restore drawing state before startAngle rotation and main translate
    }

    // --- Interface Methods ---
    getDisplayName() { return "L-System Generator"; }
    getFormula() { return `Rule: ${this.ruleSetKey}, Iter: ${this.iterations}`; }
    getExplanation() {
        return `<h3>L-System Generator</h3><p>L-Systems (Lindenmayer Systems) are string rewriting systems used to model biological growth and generate fractals. They start with an initial string (axiom) and iteratively replace characters based on production rules.</p><p>The resulting string is then interpreted as instructions for 'turtle graphics': <code>F</code> means move forward drawing a line, <code>+</code> means turn right by a set angle, <code>-</code> means turn left. Other common symbols include <code>[</code> (push current state: position & angle) and <code>]</code> (pop state), allowing for branching structures.</p><p>This creates intricate, often self-similar patterns resembling natural forms.</p><p><strong>Parameters:</strong></p><ul><li><span class="variable">Preset</span>: Selects predefined axioms, rules, and suggested starting angles (like Koch Snowflake, Dragon Curve, Fractal Plant). The angle slider can override the preset's suggestion.</li><li><span class="variable">Iterations</span>: The number of times the rewriting rules are applied. Higher iterations create more complex and detailed fractals but take longer to calculate and draw.</li><li><span class="variable">Angle</span>: The angle (in degrees) the turtle turns for '+' and '-' commands. Different angles produce vastly different shapes.</li><li><span class="variable">Segment Length</span>: The base length of the line segment drawn for each 'F' command (may shrink in deeper iterations).</li></ul><p>When animated, the path is drawn segment by segment, revealing the construction process.</p>`;
    }
    isAnimatable() { return true; }

    activate() {
        console.log("L-System activate called.");
        // Let's only regenerate if parameters *actually* changed, otherwise just reset animation
        // this.needsGeneration = true; // Maybe too aggressive?
        this.resetAnimation();
        this.updateControls();
        this.p.redraw();
    }

} // End class LSystemVisualization
"""

# Create the file
try:
    with open("lsystem.js", "w") as f:
        f.write(lsystem_js_content)
    print("File 'lsystem.js' created successfully.")
except Exception as e:
    print(f"Error creating file 'lsystem.js': {e}")