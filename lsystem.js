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

// GCD function (if needed by presets or drawing logic, otherwise can be removed)
// function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }

export default class LSystemVisualization {
    constructor(p, controlsElement) {
        console.log("LSystemVisualization constructor called."); // Debug log
        this.p = p;
        this.controls = controlsElement;
        if (!this.controls) console.error("LSystem controls div not passed correctly!");

        // State
        this.ruleSetKey = 'plant';
        this.iterations = 4;
        this.angle = presets[this.ruleSetKey].angle; // Use preset angle initially
        this.stepLength = 5;
        this.lstring = "";
        this.needsGeneration = true;
        this.currentIndex = 0; // Animation state
        this.drawingStack = []; // Stack for saving drawing state ([ and ])

        // Get specific controls
        this.presetSelect = p.select('#lsystemPreset', this.controls?.elt);
        this.iterationsSlider = p.select('#lsystemIterations', this.controls?.elt);
        this.iterationsValSpan = p.select('#lsystemIterationsVal', this.controls?.elt);
        this.angleSlider = p.select('#lsystemAngle', this.controls?.elt);
        this.angleValSpan = p.select('#lsystemAngleVal', this.controls?.elt);
        this.stepLengthSlider = p.select('#lsystemStepLength', this.controls?.elt);
        this.stepLengthValSpan = p.select('#lsystemStepLengthVal', this.controls?.elt);
        this.restartBtn = p.select('#restartLSystemBtn', this.controls?.elt); // ID from index.html

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
        this.updateControls(); // Set initial slider values/displays correctly
        this.generate(); // Generate the initial string
    }

    // Helper to add listener and bind 'this' correctly
    addListener(element, eventType, handler) {
        if (element) {
            element[eventType](() => handler.call(this)); // Use arrow function to preserve 'this'
        } else {
             console.warn(`L-System control element not found during listener attachment.`);
        }
    }

    updateParams() {
        let presetChanged = false;
        let needsRegen = false;

        // Preset Change
        if (this.presetSelect) {
            let newPresetKey = this.presetSelect.value();
            if (newPresetKey !== this.ruleSetKey && presets[newPresetKey]) {
                this.ruleSetKey = newPresetKey;
                this.angle = presets[this.ruleSetKey].angle; // Reset angle to preset default
                presetChanged = true;
                needsRegen = true;
                console.log("L-System Preset changed to:", this.ruleSetKey);
            }
        }

        // Iterations Change
        if (this.iterationsSlider) {
            let newIterations = parseInt(this.iterationsSlider.value());
            if (newIterations !== this.iterations) {
                this.iterations = newIterations;
                needsRegen = true;
            }
            if (this.iterationsValSpan) this.iterationsValSpan.html(this.iterations);
        }

        // Angle Change (Override preset if slider moved after preset change)
        if (this.angleSlider) {
            if (presetChanged) {
                // If preset just changed, update slider to match preset's angle
                this.angleSlider.value(this.angle);
            } else {
                // Otherwise, read the slider value
                let newAngle = parseFloat(this.angleSlider.value());
                if (newAngle !== this.angle) {
                    this.angle = newAngle;
                    // Angle change alone doesn't require regenerating the string, just redraw
                }
            }
            if (this.angleValSpan) this.angleValSpan.html(this.angle.toFixed(0));
        }

        // Step Length Change
        if (this.stepLengthSlider) {
            let newLength = parseFloat(this.stepLengthSlider.value());
            if (newLength !== this.stepLength) {
                this.stepLength = newLength;
                // Length change alone doesn't require regenerating the string, just redraw
            }
            if (this.stepLengthValSpan) this.stepLengthValSpan.html(this.stepLength.toFixed(0));
        }

        // Trigger regeneration or redraw
        if (needsRegen) {
            this.needsGeneration = true;
            this.resetAnimation(); // Also reset animation progress
            this.p.redraw(); // Regenerate will happen in draw cycle if needed
            console.log("L-System flagged for regeneration.");
        } else {
            // If only angle or length changed, just redraw
            this.p.redraw();
        }
    }

    // Updates sliders/select to match current internal state (useful on activation)
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

    // Called when Regenerate button is pressed
    restart() {
        console.log("L-System Restart (Regenerate) called.");
        this.needsGeneration = true;
        this.resetAnimation();
        this.p.redraw();
    }

    resetAnimation() {
        this.currentIndex = 0;
        this.drawingStack = []; // Clear the drawing state stack
    }

    generate() {
        console.log(`Generating L-System: ${this.ruleSetKey}, Iterations: ${this.iterations}`);
        const ruleset = presets[this.ruleSetKey];
        if (!ruleset) {
            console.error("Invalid L-System preset key:", this.ruleSetKey);
            this.lstring = "";
            this.needsGeneration = false;
            return;
        }

        this.lstring = ruleset.axiom;
        try {
            for (let i = 0; i < this.iterations; i++) {
                let nextString = "";
                for (let char of this.lstring) {
                    nextString += ruleset.rules[char] || char;
                }
                this.lstring = nextString;
                // Add length check to prevent browser freeze
                if (this.lstring.length > 300000) { // Adjust limit as needed
                    console.warn(`L-System string length exceeded limit (${this.lstring.length}). Stopping generation.`);
                    this.iterations = i + 1; // Update state to reflect actual iterations done
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
        this.resetAnimation(); // Reset animation index after generating
    }

    draw(sharedState) {
        // console.log("L-System draw method called."); // Debug log (can be noisy)
        const p = this.p;

        if (this.needsGeneration) {
            this.generate();
        }

        if (!this.lstring) {
            p.push(); p.fill(0,0,80); p.textAlign(p.CENTER); p.textSize(16);
            p.text("Generating L-System...", 0, 0); // Centered due to main draw translate
            p.pop();
            return;
        }

        // --- Drawing Logic ---
        p.push(); // Isolate transforms and styles for this drawing
        p.stroke(120, 80, 90); // Green color for plants etc.
        p.strokeWeight(1.5);

        // Initial state - Apply starting angle correction from preset if available
        let startAngle = presets[this.ruleSetKey]?.startAngle || 0;
        p.rotate(startAngle); // Adjust initial orientation based on preset


        // Calculate bounds or estimate scale dynamically if needed (complex)
        // For now, rely on stepLength and let it draw from center

        const commands = this.lstring;
        const drawLimit = sharedState.animate ? this.currentIndex + Math.ceil(sharedState.speed * 5) : commands.length; // Draw more steps per frame in animation
        const effectiveLimit = Math.min(drawLimit, commands.length);

        // Reset stack for each draw if drawing from scratch
        if (!sharedState.animate || this.currentIndex === 0) {
             this.drawingStack = [];
        }

        // Optimization: If not animating, potentially pre-calculate points? (more complex)

        for (let i = sharedState.animate ? this.currentIndex : 0; i < effectiveLimit; i++) {
            const cmd = commands[i];

            if (cmd === 'F' || cmd === 'G') { // Draw forward (F) or Move forward (G)
                p.line(0, 0, this.stepLength, 0);
                p.translate(this.stepLength, 0);
            } else if (cmd === '+') { // Turn left
                p.rotate(-this.angle);
            } else if (cmd === '-') { // Turn right
                p.rotate(this.angle);
            } else if (cmd === '[') { // Save state
                this.drawingStack.push({
                    position: p.createVector(0, 0), // Position relative to current matrix isn't needed directly
                    transformMatrix: p.drawingContext.getTransform() // Save the full current transform
                });
                p.push(); // p5's way to save current style and transformation state
            } else if (cmd === ']') { // Restore state
                p.pop(); // p5's way to restore previous style and transformation state
                // Note: p5's push/pop handles the matrix stack. Manual stack might be redundant unless storing extra data.
                // If needed: const state = this.drawingStack.pop(); // Retrieve state if necessary
            }
            // Ignore other characters (like X, Y, etc.)
        }

        if (sharedState.animate) {
            this.currentIndex = effectiveLimit;
            if (this.currentIndex >= commands.length) {
                // Optional: stop animation loop? Or just let it sit idle.
                // console.log("L-System animation complete.");
            }
        }

        p.pop(); // Restore initial drawing state (before rotate(startAngle))
    }

    // --- Interface Methods ---
    getDisplayName() { return "L-System Generator"; }

    getFormula() {
        // Return a representation of the current rule or just a general name
        return `Rule: ${this.ruleSetKey}, Iter: ${this.iterations}`;
    }

    getExplanation() {
        // Return the full explanation HTML string
        return `<h3>L-System Generator</h3><p>L-Systems (Lindenmayer Systems) are string rewriting systems used to model biological growth and generate fractals. They start with an initial string (axiom) and iteratively replace characters based on production rules.</p><p>The resulting string is then interpreted as instructions for 'turtle graphics': <code>F</code> means move forward drawing a line, <code>+</code> means turn right by a set angle, <code>-</code> means turn left. Other common symbols include <code>[</code> (push current state: position & angle) and <code>]</code> (pop state), allowing for branching structures.</p><p>This creates intricate, often self-similar patterns resembling natural forms.</p><p><strong>Parameters:</strong></p><ul><li><span class="variable">Preset</span>: Selects predefined axioms, rules, and suggested starting angles (like Koch Snowflake, Dragon Curve, Fractal Plant). The angle slider can override the preset's suggestion.</li><li><span class="variable">Iterations</span>: The number of times the rewriting rules are applied. Higher iterations create more complex and detailed fractals but take longer to calculate and draw.</li><li><span class="variable">Angle</span>: The angle (in degrees) the turtle turns for '+' and '-' commands. Different angles produce vastly different shapes.</li><li><span class="variable">Segment Length</span>: The base length of the line segment drawn for each 'F' command (may shrink in deeper iterations).</li></ul><p>When animated, the path is drawn segment by segment, revealing the construction process.</p>`;
    }

    isAnimatable() { return true; }

    // No need for showControls/hideControls if main.js handles parent div visibility
    // showControls() { if (this.controls) this.controls.addClass('active'); }
    // hideControls() { if (this.controls) this.controls.removeClass('active'); }

    activate() {
        console.log("L-System activate called.");
        this.needsGeneration = true; // Force regeneration on activation? Or only if params changed? Let's regenerate.
        this.resetAnimation();
        this.updateControls(); // Ensure controls match current state
        this.p.redraw(); // Trigger redraw (which will trigger generate if needed)
    }

} // End class LSystemVisualization
