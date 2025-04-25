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
        this.delta = this.defaultDelta; // Keep delta in degrees (from slider)
        this.trailLength = this.defaultTrailLength;
        this.pointSize = this.defaultPointSize;

        // Animation State
        this.points = []; // Stores points for the trail
        this.currentTime = 0; // Tracks 't' (conceptually radians) for animation

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
        this.resetBtn = p.select('#resetLissajousBtn', this.controls?.elt);

        // Attach listeners
        this.addListener(this.sliderA, 'input', this.updateParams);
        this.addListener(this.sliderB, 'input', this.updateParams);
        this.addListener(this.sliderFreqA, 'input', this.updateParams);
        this.addListener(this.sliderFreqB, 'input', this.updateParams);
        this.addListener(this.sliderDelta, 'input', this.updateParams);
        this.addListener(this.sliderTrail, 'input', this.updateParams);
        this.addListener(this.sliderSize, 'input', this.updateParams);
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
            element[eventType](() => handler.call(this));
        } else {
             console.warn(`Lissajous control element not found during listener attachment.`);
        }
    }

    updateParams() {
        let needsReset = false;
        let newA = this.sliderA ? parseFloat(this.sliderA.value()) : this.a; if (newA !== this.a) { this.a = newA; needsReset = true; }
        let newB = this.sliderB ? parseFloat(this.sliderB.value()) : this.b; if (newB !== this.b) { this.b = newB; needsReset = true; }
        let newFreqA = this.sliderFreqA ? parseInt(this.sliderFreqA.value()) : this.freqA; if (newFreqA !== this.freqA) { this.freqA = newFreqA; needsReset = true; }
        let newFreqB = this.sliderFreqB ? parseInt(this.sliderFreqB.value()) : this.freqB; if (newFreqB !== this.freqB) { this.freqB = newFreqB; needsReset = true; }
        let newDelta = this.sliderDelta ? parseFloat(this.sliderDelta.value()) : this.delta; if (newDelta !== this.delta) { this.delta = newDelta; needsReset = true; } // Keep delta in degrees
        let newTrail = this.sliderTrail ? parseInt(this.sliderTrail.value()) : this.trailLength; if (newTrail !== this.trailLength) this.trailLength = newTrail;
        let newSize = this.sliderSize ? parseInt(this.sliderSize.value()) : this.pointSize; if (newSize !== this.pointSize) this.pointSize = newSize;

        // Update display spans
        if (this.valA) this.valA.html(this.a.toFixed(0));
        if (this.valB) this.valB.html(this.b.toFixed(0));
        if (this.valFreqA) this.valFreqA.html(this.freqA);
        if (this.valFreqB) this.valFreqB.html(this.freqB);
        if (this.valDelta) this.valDelta.html(this.delta.toFixed(0)); // Display delta in degrees
        if (this.valTrail) this.valTrail.html(this.trailLength);
        if (this.valSize) this.valSize.html(this.pointSize);

        if (needsReset) { this.resetAnimation(); }
        this.p.redraw();
    }

    resetDefaults() {
        console.log("Resetting Lissajous parameters to defaults.");
        this.a = this.defaultA; this.b = this.defaultB;
        this.freqA = this.defaultFreqA; this.freqB = this.defaultFreqB;
        this.delta = this.defaultDelta;
        this.trailLength = this.defaultTrailLength; this.pointSize = this.defaultPointSize;

        if (this.sliderA) this.sliderA.value(this.a); if (this.sliderB) this.sliderB.value(this.b);
        if (this.sliderFreqA) this.sliderFreqA.value(this.freqA); if (this.sliderFreqB) this.sliderFreqB.value(this.freqB);
        if (this.sliderDelta) this.sliderDelta.value(this.delta);
        if (this.sliderTrail) this.sliderTrail.value(this.trailLength); if (this.sliderSize) this.sliderSize.value(this.pointSize);

        this.resetAnimation();
        this.updateParams();
        this.p.redraw();
    }

    resetAnimation() {
        this.points = []; this.currentTime = 0;
        console.log("Lissajous animation reset.");
    }

    draw(sharedState) {
        const p = this.p;
        if (!isFinite(this.a) || !isFinite(this.b) || this.a <= 0 || this.b <= 0 || !isFinite(this.freqA) || !isFinite(this.freqB) || !isFinite(this.delta) || !isFinite(this.trailLength) || !isFinite(this.pointSize)) {
            console.error("Invalid parameters for drawLissajous.");
            p.push(); p.fill(0, 100, 80); p.textAlign(p.CENTER); p.textSize(16);
            p.text("Invalid Lissajous Parameters", 0, 0); // Centered via main.js translate
            p.pop(); return;
        }

        let drawA = this.a; let drawB = this.b;
        p.push();

        // Conversion factor from radians to degrees
        const radToDeg = 180 / Math.PI;

        if (sharedState.animate) {
            // --- Animated Drawing ---
            // Increment time (treating currentTime conceptually as radians for smooth progression)
            this.currentTime += sharedState.speed * 0.05;
            let t_rad = this.currentTime;

            // *** Convert t to degrees for p.sin() ***
            let t_deg = t_rad * radToDeg;

            // Calculate current point using degrees
            // Use this.delta directly as it's already in degrees
            let currentX = drawA * p.sin(this.freqA * t_deg + this.delta);
            let currentY = drawB * p.sin(this.freqB * t_deg);

            this.points.push({ x: currentX, y: currentY });
            while (this.points.length > this.trailLength) { this.points.shift(); }

            p.noFill();
            for (let i = 0; i < this.points.length; i++) {
                let pt = this.points[i];
                let brightness = p.map(i, 0, this.points.length - 1, 20, 100);
                let alpha = p.map(i, 0, this.points.length - 1, 0.1, 1.0);
                p.strokeWeight(this.pointSize);
                p.stroke(180, 80, brightness, alpha); // Cyan/Teal trail
                p.point(pt.x, pt.y);
            }
        } else {
            // --- Static Drawing ---
            if (this.points.length > 0 || this.currentTime !== 0) { this.resetAnimation(); }

            p.strokeWeight(1.5);
            p.stroke(180, 90, 90); // Bright Cyan/Teal
            p.noFill();
            p.beginShape();

            // Define range in radians, but convert inside the loop for p.sin()
            let maxT_rad = 2 * Math.PI * 12; // Range for t in radians
            let numSteps = 1000;

            for (let i = 0; i <= numSteps; i++) {
                 // Calculate t in radians for mapping
                 let t_rad = p.map(i, 0, numSteps, 0, maxT_rad);
                 // *** Convert t to degrees for p.sin() ***
                 let t_deg = t_rad * radToDeg;

                 // Calculate point using degrees
                 // Use this.delta directly as it's already in degrees
                 let x = drawA * p.sin(this.freqA * t_deg + this.delta);
                 let y = drawB * p.sin(this.freqB * t_deg);
                 p.vertex(x, y);
            }
            p.endShape();
        }
        p.pop();
    }

    // --- Interface Methods for main.js ---
    getDisplayName() { return "Lissajous Curves"; }
    getFormula() { return `x = A&sdot;sin(a&sdot;t + &delta;), y = B&sdot;sin(b&sdot;t)`; }
    getExplanation() {
         return `<h3>Lissajous Curves</h3><p>These curves are produced by the intersection of two sinusoidal curves vibrating at right angles to each other. They are described by parametric equations where the x and y coordinates are functions of time (t).</p><p>The shape of the curve is highly dependent on the ratio of the frequencies (a/b) and the phase difference (&delta;).</p><ul><li><span class="variable">A, B</span>: Amplitudes of the x and y sinusoids, controlling the width and height.</li><li><span class="variable">a, b</span>: Frequencies of the x and y sinusoids. The ratio a:b determines the complexity and number of lobes.</li><li><span class="variable">&delta;</span>: Phase difference between the two sinusoids (in degrees). Affects the curve's rotation and shape (e.g., 90° often gives ellipses or circles if A=B and a=b).</li><li><span class="variable">Trail</span>: (Animation only) Number of points shown in the animated trail.</li><li><span class="variable">Size</span>: (Animation only) Size of the points in the animated trail.</li></ul>`;
     }
    isAnimatable() { return true; }

    activate() {
        console.log("Lissajous activate called.");
        this.resetAnimation();
        this.updateParams();
        this.p.redraw();
    }

} // End class LissajousVisualization