// lissajous.js - Module for Lissajous Curves Visualization

export default class LissajousVisualization {
    constructor(p, controlsElement) {
        this.p = p; // p5 instance
        this.controls = controlsElement; // Reference to #lissajousControls div

        // Default State Values
        this.defaultA = 150;
        this.defaultB = 150;
        this.defaultFreqA = 3;
        this.defaultFreqB = 2;
        this.defaultDelta = 90;
        this.defaultTrailLength = 200;
        this.defaultPointSize = 2;

        // Current State (initialize with defaults)
        this.a = this.defaultA;
        this.b = this.defaultB;
        this.freqA = this.defaultFreqA;
        this.freqB = this.defaultFreqB;
        this.delta = this.defaultDelta;
        this.trailLength = this.defaultTrailLength;
        this.pointSize = this.defaultPointSize;

        // Animation State
        this.points = []; // Stores points for the trail
        this.currentTime = 0; // Tracks 't' for animation

        // Get specific controls from within the parent
        this.sliderA = p.select('#lissajousA', this.controls?.elt);
        this.valA = p.select('#lissajousAVal', this.controls?.elt);
        this.sliderB = p.select('#lissajousB', this.controls?.elt);
        this.valB = p.select('#lissajousBVal', this.controls?.elt);
        this.sliderFreqA = p.select('#lissajousFreqA', this.controls?.elt);
        this.valFreqA = p.select('#lissajousFreqAVal', this.controls?.elt);
        this.sliderFreqB = p.select('#lissajousFreqB', this.controls?.elt);
        this.valFreqB = p.select('#lissajousFreqBVal', this.controls?.elt);
        this.sliderDelta = p.select('#lissajousDelta', this.controls?.elt);
        this.valDelta = p.select('#lissajousDeltaVal', this.controls?.elt);
        this.sliderTrail = p.select('#lissajousTrail', this.controls?.elt);
        this.valTrail = p.select('#lissajousTrailVal', this.controls?.elt);
        this.sliderSize = p.select('#lissajousSize', this.controls?.elt);
        this.valSize = p.select('#lissajousSizeVal', this.controls?.elt);
        // Selector for the reset button (ID from index.html)
        this.resetBtn = p.select('#resetLissajousBtn', this.controls?.elt);


        // Attach listeners
        this.addListener(this.sliderA, 'input', this.updateParams);
        this.addListener(this.sliderB, 'input', this.updateParams);
        this.addListener(this.sliderFreqA, 'input', this.updateParams);
        this.addListener(this.sliderFreqB, 'input', this.updateParams);
        this.addListener(this.sliderDelta, 'input', this.updateParams);
        this.addListener(this.sliderTrail, 'input', this.updateParams);
        this.addListener(this.sliderSize, 'input', this.updateParams);
        // Attach listener for the reset button
        if (this.resetBtn) {
            this.resetBtn.mousePressed(() => this.resetDefaults());
            console.log("Lissajous Reset button listener attached.");
        } else {
             console.warn("Lissajous Reset Button (#resetLissajousBtn) not found within #lissajousControls");
        }

        // Initialize display
        this.updateParams();
    }

    // Helper to add listener and bind 'this' correctly
    addListener(element, eventType, handler) {
        if (element) {
            element[eventType](() => handler.call(this)); // Use arrow function to preserve 'this'
        } else {
             console.warn(`Lissajous control element not found during listener attachment.`);
        }
    }

    updateParams() {
        let needsReset = false; // Check if core parameters changed, requiring animation reset

        // Read values and check if they changed
        let newA = this.sliderA ? parseFloat(this.sliderA.value()) : this.a;
        if (newA !== this.a) { this.a = newA; needsReset = true; }


        let newB = this.sliderB ? parseFloat(this.sliderB.value()) : this.b;
        if (newB !== this.b) { this.b = newB; needsReset = true; }


        let newFreqA = this.sliderFreqA ? parseInt(this.sliderFreqA.value()) : this.freqA;
        if (newFreqA !== this.freqA) { this.freqA = newFreqA; needsReset = true; }


        let newFreqB = this.sliderFreqB ? parseInt(this.sliderFreqB.value()) : this.freqB;
        if (newFreqB !== this.freqB) { this.freqB = newFreqB; needsReset = true; }


        let newDelta = this.sliderDelta ? parseFloat(this.sliderDelta.value()) : this.delta;
        if (newDelta !== this.delta) { this.delta = newDelta; needsReset = true; }


        // Update animation-specific params without full reset
        let newTrail = this.sliderTrail ? parseInt(this.sliderTrail.value()) : this.trailLength;
        if (newTrail !== this.trailLength) this.trailLength = newTrail;


        let newSize = this.sliderSize ? parseInt(this.sliderSize.value()) : this.pointSize;
         if (newSize !== this.pointSize) this.pointSize = newSize;


        // Update display spans (always update after potential changes)
        if (this.valA) this.valA.html(this.a.toFixed(0));
        if (this.valB) this.valB.html(this.b.toFixed(0));
        if (this.valFreqA) this.valFreqA.html(this.freqA);
        if (this.valFreqB) this.valFreqB.html(this.freqB);
        if (this.valDelta) this.valDelta.html(this.delta.toFixed(0));
        if (this.valTrail) this.valTrail.html(this.trailLength);
        if (this.valSize) this.valSize.html(this.pointSize);


        // Reset animation if core shape parameters changed
        if (needsReset) {
            this.resetAnimation();
        }

        this.p.redraw(); // Always redraw when any param changes
    }

    resetDefaults() {
        console.log("Resetting Lissajous parameters to defaults.");
        // Set internal state back to defaults
        this.a = this.defaultA;
        this.b = this.defaultB;
        this.freqA = this.defaultFreqA;
        this.freqB = this.defaultFreqB;
        this.delta = this.defaultDelta;
        this.trailLength = this.defaultTrailLength;
        this.pointSize = this.defaultPointSize;

        // Update slider positions to match defaults
        if (this.sliderA) this.sliderA.value(this.a);
        if (this.sliderB) this.sliderB.value(this.b);
        if (this.sliderFreqA) this.sliderFreqA.value(this.freqA);
        if (this.sliderFreqB) this.sliderFreqB.value(this.freqB);
        if (this.sliderDelta) this.sliderDelta.value(this.delta);
        if (this.sliderTrail) this.sliderTrail.value(this.trailLength);
        if (this.sliderSize) this.sliderSize.value(this.pointSize);

        // Update the display values and trigger reset/redraw
        this.resetAnimation(); // Reset the drawing trail
        this.updateParams();   // Update spans
        this.p.redraw();       // Trigger redraw
    }


    resetAnimation() {
        this.points = [];
        this.currentTime = 0;
        console.log("Lissajous animation reset.");
    }

    draw(sharedState) {
        const p = this.p; // Use stored p5 instance

        // Parameter validation (basic check)
        if (!isFinite(this.a) || !isFinite(this.b) || this.a <= 0 || this.b <= 0 ||
            !isFinite(this.freqA) || !isFinite(this.freqB) || !isFinite(this.delta) ||
            !isFinite(this.trailLength) || !isFinite(this.pointSize)) {
            console.error("Invalid parameters for drawLissajous.");
            // Draw error message centered on canvas (assuming translate is applied in main.js)
            p.push(); p.fill(0, 100, 80); p.textAlign(p.CENTER); p.textSize(16);
            p.text("Invalid Lissajous Parameters", 0, 0);
            p.pop();
            return;
        }

        // NOTE: Scaling is removed here, assuming main.js handles centering via translate.
        // Amplitudes 'a' and 'b' will now directly correspond to pixels from the center.
        let drawA = this.a;
        let drawB = this.b;

        p.push(); // Isolate drawing styles

        if (sharedState.animate) {
            // --- Animated Drawing ---
            this.currentTime += sharedState.speed * 0.05; // Adjust multiplier for animation speed sensitivity

            // Calculate current point
            let t = this.currentTime;
            // Convert delta from degrees (slider) to radians (sin function)
            let deltaRad = this.delta * (Math.PI / 180);
            let currentX = drawA * p.sin(this.freqA * t + deltaRad);
            let currentY = drawB * p.sin(this.freqB * t);

            // Add to trail
            this.points.push({ x: currentX, y: currentY });

            // Limit trail length
            while (this.points.length > this.trailLength) {
                this.points.shift(); // Remove oldest point
            }

            // Draw the trail with fading effect
            p.noFill();
            for (let i = 0; i < this.points.length; i++) {
                let pt = this.points[i];
                // Map index to brightness/alpha for fading
                let brightness = p.map(i, 0, this.points.length - 1, 20, 100); // Fade brightness
                let alpha = p.map(i, 0, this.points.length - 1, 0.1, 1.0);    // Fade alpha
                p.strokeWeight(this.pointSize);
                // Use a distinct color, e.g., Cyan/Teal
                p.stroke(180, 80, brightness, alpha);
                p.point(pt.x, pt.y);
            }

        } else {
            // --- Static Drawing ---
            // Reset animation state if switched from animated
            if (this.points.length > 0 || this.currentTime !== 0) {
                this.resetAnimation();
            }

            p.strokeWeight(1.5);
            p.stroke(180, 90, 90); // Bright Cyan/Teal
            p.noFill();
            p.beginShape();
            // Calculate points for the full curve
            // Need enough steps to make it smooth, and cover the full period
            // LCM of periods is 2*PI / gcd(freqA, freqB) - but simpler to just draw enough points
            let maxT = 2 * Math.PI; // Draw one full cycle based on standard trig period
            let numSteps = 500; // Number of vertices for smoothness

            for (let i = 0; i <= numSteps; i++) {
                 let t = p.map(i, 0, numSteps, 0, maxT);
                 let deltaRad = this.delta * (Math.PI / 180);
                 let x = drawA * p.sin(this.freqA * t + deltaRad);
                 let y = drawB * p.sin(this.freqB * t);
                 p.vertex(x, y);
            }
            p.endShape(); // Don't explicitly close for non-integer frequencies
        }

        p.pop(); // Restore drawing styles
    }

    // --- Interface Methods for main.js ---
    getDisplayName() { return "Lissajous Curves"; }
    getFormula() { return `x = A&sdot;sin(a&sdot;t + &delta;), y = B&sdot;sin(b&sdot;t)`; }
    getExplanation() {
         // Provide the full explanation HTML
         return `<h3>Lissajous Curves</h3><p>These curves are produced by the intersection of two sinusoidal curves vibrating at right angles to each other. They are described by parametric equations where the x and y coordinates are functions of time (t).</p><p>The shape of the curve is highly dependent on the ratio of the frequencies (a/b) and the phase difference (&delta;).</p><ul><li><span class="variable">A, B</span>: Amplitudes of the x and y sinusoids, controlling the width and height.</li><li><span class="variable">a, b</span>: Frequencies of the x and y sinusoids. The ratio a:b determines the complexity and number of lobes.</li><li><span class="variable">&delta;</span>: Phase difference between the two sinusoids (in degrees). Affects the curve's rotation and shape (e.g., 90° often gives ellipses or circles if A=B and a=b).</li><li><span class="variable">Trail</span>: (Animation only) Number of points shown in the animated trail.</li><li><span class="variable">Size</span>: (Animation only) Size of the points in the animated trail.</li></ul>`;
     }
    isAnimatable() { return true; } // This one *can* be animated

    activate() {
        console.log("Lissajous activate called.");
        this.resetAnimation(); // Reset animation on activation
        this.updateParams(); // Ensure UI reflects current state
        this.p.redraw();
    }

} // End class LissajousVisualization