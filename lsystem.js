// lsystem.js - Module for L-System Visualization with Auto-Scaling

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
        this.stepLength = 5; // Base length unit, actual size determined by scaling
        this.lstring = "";
        this.needsGeneration = true;
        this.currentIndex = 0; // Animation progress index

        // Bounds and Transform State
        this.bounds = { minX: 0, maxX: 0, minY: 0, maxY: 0, calculated: false };
        this.scaleFactor = 1.0;
        this.offsetX = 0;
        this.offsetY = 0;

        // Get specific controls... (selectors remain the same)
        this.presetSelect = p.select('#lsystemPreset', this.controls?.elt);
        this.iterationsSlider = p.select('#lsystemIterations', this.controls?.elt);
        this.iterationsValSpan = p.select('#lsystemIterationsVal', this.controls?.elt);
        this.angleSlider = p.select('#lsystemAngle', this.controls?.elt);
        this.angleValSpan = p.select('#lsystemAngleVal', this.controls?.elt);
        this.stepLengthSlider = p.select('#lsystemStepLength', this.controls?.elt);
        this.stepLengthValSpan = p.select('#lsystemStepLengthVal', this.controls?.elt);
        this.restartBtn = p.select('#restartLSystemBtn', this.controls?.elt);

        // Attach listeners... (listeners remain the same)
        this.addListener(this.presetSelect, 'changed', this.updateParams);
        this.addListener(this.iterationsSlider, 'input', this.updateParams);
        this.addListener(this.angleSlider, 'input', this.updateParams);
        this.addListener(this.stepLengthSlider, 'input', this.updateParams);
        if (this.restartBtn) { this.restartBtn.mousePressed(() => this.restart()); }

        // Initial setup
        this.updateControls();
        this.generateAndCalculateBounds(); // Combined generation and bounds calculation
    }

    addListener(element, eventType, handler) { /* ... as before ... */
        if (element) { element[eventType](() => handler.call(this)); }
        else { console.warn(`L-System control element not found during listener attachment.`); }
    }

    updateParams() { /* ... as before, but now triggers generateAndCalculateBounds ... */
        let presetChanged = false; let needsRegen = false;
        // Read preset
        if (this.presetSelect) {
            let newPresetKey = this.presetSelect.value();
            if (newPresetKey !== this.ruleSetKey && presets[newPresetKey]) {
                this.ruleSetKey = newPresetKey; this.angle = presets[this.ruleSetKey].angle;
                presetChanged = true; needsRegen = true;
            }
        }
        // Read iterations
        if (this.iterationsSlider) {
            let newIterations = parseInt(this.iterationsSlider.value());
            if (newIterations !== this.iterations) { this.iterations = newIterations; needsRegen = true; }
            if (this.iterationsValSpan) this.iterationsValSpan.html(this.iterations);
        }
        // Read angle
        if (this.angleSlider) {
            if (presetChanged) { this.angleSlider.value(this.angle); }
            else { let newAngle = parseFloat(this.angleSlider.value()); if (newAngle !== this.angle) { this.angle = newAngle; needsRegen = true; } } // Angle change now forces recalc of bounds
            if (this.angleValSpan) this.angleValSpan.html(this.angle.toFixed(0));
        }
        // Read length
        if (this.stepLengthSlider) {
            let newLength = parseFloat(this.stepLengthSlider.value());
            if (newLength !== this.stepLength) { this.stepLength = newLength; needsRegen = true; } // Length change now forces recalc of bounds
            if (this.stepLengthValSpan) this.stepLengthValSpan.html(this.stepLength.toFixed(0));
        }

        if (needsRegen) {
            this.needsGeneration = true; this.resetAnimation(); this.p.redraw();
            console.log("L-System flagged for regeneration and bounds calculation.");
        } else { /* Only redraw if nothing changed */ }
    }

    updateControls() { /* ... as before ... */
        console.log("Updating L-System controls to match state.");
        if (this.presetSelect) this.presetSelect.value(this.ruleSetKey);
        if (this.iterationsSlider) this.iterationsSlider.value(this.iterations);
        if (this.iterationsValSpan) this.iterationsValSpan.html(this.iterations);
        if (this.angleSlider) this.angleSlider.value(this.angle);
        if (this.angleValSpan) this.angleValSpan.html(this.angle.toFixed(0));
        if (this.stepLengthSlider) this.stepLengthSlider.value(this.stepLength);
        if (this.stepLengthValSpan) this.stepLengthValSpan.html(this.stepLength.toFixed(0));
    }

    restart() { /* ... as before, triggers generateAndCalculateBounds via redraw ... */
        console.log("L-System Restart (Regenerate) called.");
        this.needsGeneration = true; this.resetAnimation();
        this.p.redraw();
    }

    resetAnimation() { this.currentIndex = 0; }

    generateAndCalculateBounds() {
        if (!this.needsGeneration) return;
        console.log("Generating L-System string...");
        this.generate(); // Generate the string first
        console.log("Calculating L-System bounds...");
        this.calculateBounds(); // Then calculate bounds based on the new string/params
        this.needsGeneration = false; // Mark as done
        this.resetAnimation();
    }

    generate() { /* ... string generation logic as before ... */
        const ruleset = presets[this.ruleSetKey];
        if (!ruleset) { console.error("Invalid L-System preset key:", this.ruleSetKey); this.lstring = ""; return; }
        this.lstring = ruleset.axiom;
        try {
            for (let i = 0; i < this.iterations; i++) {
                let nextString = ""; for (let char of this.lstring) { nextString += ruleset.rules[char] || char; }
                this.lstring = nextString;
                if (this.lstring.length > 300000) { console.warn(`L-System string length limit exceeded.`); this.iterations = i + 1; this.updateControls(); break; }
            }
            console.log("L-System generation complete. String length:", this.lstring.length);
        } catch (e) { console.error("Error generating L-System string:", e); this.lstring = ruleset.axiom; }
    }

    calculateBounds() {
        const p = this.p;
        let x = 0, y = 0;
        let angle = presets[this.ruleSetKey]?.startAngle || 0;
        let minX = 0, maxX = 0, minY = 0, maxY = 0;
        const stack = []; // To store {x, y, angle} states

        const commands = this.lstring;
        for (let i = 0; i < commands.length; i++) {
            const cmd = commands[i];

            if (cmd === 'F' || cmd === 'G') {
                // Calculate end point of the move
                const radAngle = p.radians(angle); // Convert current angle to radians for trig
                x += this.stepLength * p.cos(radAngle);
                y += this.stepLength * p.sin(radAngle);
                // Update bounds
                minX = Math.min(minX, x); maxX = Math.max(maxX, x);
                minY = Math.min(minY, y); maxY = Math.max(maxY, y);
            } else if (cmd === '+') {
                angle -= this.angle; // Assuming angleMode is DEGREES
            } else if (cmd === '-') {
                angle += this.angle; // Assuming angleMode is DEGREES
            } else if (cmd === '[') {
                stack.push({ x, y, angle }); // Save state
            } else if (cmd === ']') {
                if (stack.length > 0) {
                    const state = stack.pop(); // Restore state
                    x = state.x; y = state.y; angle = state.angle;
                }
            }
        }

        this.bounds = { minX, maxX, minY, maxY, calculated: true };
        console.log("Bounds calculated:", this.bounds);

        // Calculate Scale and Offset
        const boundsWidth = this.bounds.maxX - this.bounds.minX;
        const boundsHeight = this.bounds.maxY - this.bounds.minY;
        const padding = 0.90; // Use 90% of canvas space

        if (boundsWidth === 0 || boundsHeight === 0) {
            this.scaleFactor = 1; // Avoid division by zero if fractal is a point/line
        } else {
            let scaleX = (p.width * padding) / boundsWidth;
            let scaleY = (p.height * padding) / boundsHeight;
            this.scaleFactor = Math.min(scaleX, scaleY);
        }

        if (!isFinite(this.scaleFactor) || this.scaleFactor <= 0) {
            console.warn("Invalid scale factor calculated. Defaulting to 1.");
            this.scaleFactor = 1;
        }

        // Calculate offset needed to center the scaled bounds
        const centerX = (this.bounds.minX + this.bounds.maxX) / 2;
        const centerY = (this.bounds.minY + this.bounds.maxY) / 2;
        this.offsetX = -centerX; // Offset to bring center of bounds to (0,0)
        this.offsetY = -centerY;

        console.log(`Scale: ${this.scaleFactor.toFixed(3)}, Offset: (${this.offsetX.toFixed(2)}, ${this.offsetY.toFixed(2)})`);
    }


    draw(sharedState) {
        const p = this.p;

        if (this.needsGeneration) { this.generateAndCalculateBounds(); }
        if (!this.lstring || !this.bounds.calculated) { /* ... show loading text ... */
            p.push(); p.fill(0,0,80); p.textAlign(p.CENTER); p.textSize(16);
            p.text("Generating & Calculating...", 0, 0); p.pop(); return;
        }

        // --- Drawing Logic with Scaling ---
        p.push(); // Isolate transforms

        // Apply transformations to center and scale the L-system
        // 1. Move origin to canvas center
        p.translate(p.width / 2, p.height / 2);
        // 2. Apply calculated scale
        p.scale(this.scaleFactor);
        // 3. Translate to center the bounds (using precalculated offset)
        p.translate(this.offsetX, this.offsetY);
        // 4. Apply the initial rotation for the specific preset
        let startAngle = presets[this.ruleSetKey]?.startAngle || 0;
        p.rotate(startAngle); // Assuming angleMode DEGREES


        // Set drawing style
        p.stroke(120, 80, 90); // Green
        // Adjust stroke weight based on scale factor so lines don't get too thin/thick
        p.strokeWeight(1.5 / Math.sqrt(this.scaleFactor)); // Experiment with sqrt or linear scaling


        // Determine how much to draw
        const commands = this.lstring;
        let commandsToProcess = commands.length;
        if (sharedState.animate) {
            let stepsPerFrame = Math.ceil(sharedState.speed * (1 + Math.log10(Math.max(1, commands.length))));
            stepsPerFrame = Math.max(1, Math.min(500, stepsPerFrame)); // Limit steps per frame
            this.currentIndex = Math.min(this.currentIndex + stepsPerFrame, commands.length);
            commandsToProcess = this.currentIndex;
        }

        // Always draw from the beginning up to 'commandsToProcess'
        // The transformations are handled by p5's matrix stack with push/pop
        for (let i = 0; i < commandsToProcess; i++) {
            const cmd = commands[i];
            if (cmd === 'F') {
                p.line(0, 0, this.stepLength, 0); p.translate(this.stepLength, 0);
            } else if (cmd === 'G') {
                p.translate(this.stepLength, 0);
            } else if (cmd === '+') {
                p.rotate(-this.angle);
            } else if (cmd === '-') {
                p.rotate(this.angle);
            } else if (cmd === '[') {
                p.push();
            } else if (cmd === ']') {
                p.pop();
            }
        }

        p.pop(); // Restore initial drawing state (before translate, scale, rotate)
    }

    // --- Interface Methods ---
    getDisplayName() { return "L-System Generator"; }
    getFormula() { return `Rule: ${this.ruleSetKey}, Iter: ${this.iterations}`; }
    getExplanation() { /* ... explanation HTML string as before ... */
        return `<h3>L-System Generator</h3><p>L-Systems (Lindenmayer Systems) are string rewriting systems used to model biological growth and generate fractals. They start with an initial string (axiom) and iteratively replace characters based on production rules.</p><p>The resulting string is then interpreted as instructions for 'turtle graphics': <code>F</code> means move forward drawing a line, <code>+</code> means turn right by a set angle, <code>-</code> means turn left. Other common symbols include <code>[</code> (push current state: position & angle) and <code>]</code> (pop state), allowing for branching structures.</p><p>This creates intricate, often self-similar patterns resembling natural forms.</p><p><strong>Parameters:</strong></p><ul><li><span class="variable">Preset</span>: Selects predefined axioms, rules, and suggested starting angles (like Koch Snowflake, Dragon Curve, Fractal Plant). The angle slider can override the preset's suggestion.</li><li><span class="variable">Iterations</span>: The number of times the rewriting rules are applied. Higher iterations create more complex and detailed fractals but take longer to calculate and draw.</li><li><span class="variable">Angle</span>: The angle (in degrees) the turtle turns for '+' and '-' commands. Different angles produce vastly different shapes.</li><li><span class="variable">Segment Length</span>: The base length of the line segment drawn for each 'F' command. The overall size is now adjusted automatically to fit the canvas.</li></ul><p>When animated, the path is drawn segment by segment, revealing the construction process.</p>`;
     }
    isAnimatable() { return true; }

    activate() { /* ... as before ... */
        console.log("L-System activate called.");
        // Ensure bounds are calculated if needed on activation
        if(this.needsGeneration || !this.bounds.calculated){
             this.generateAndCalculateBounds();
        }
        this.resetAnimation();
        this.updateControls();
        this.p.redraw();
    }

} // End class LSystemVisualization