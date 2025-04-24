// lissajous.js - Module for Lissajous Curves Visualization

export default class LissajousVisualization {
    constructor(p, controlsElement) {
        this.p = p; // p5 instance
        this.controls = controlsElement; // Reference to #lissajousControls div

        // State
        this.a = 150;
        this.b = 150;
        this.freqA = 3;
        this.freqB = 2;
        this.delta = 90;
        this.trailLength = 200;
        this.pointSize = 2;

        // Animation State
        this.points = []; // Stores points for the trail
        this.currentTime = 0; // Tracks 't' for animation

        // Get specific controls from within the parent
        this.sliderA = p.select('#lissajousA', this.controls?.elt); this.valA = p.select('#lissajousAVal', this.controls?.elt);
        this.sliderB = p.select('#lissajousB', this.controls?.elt); this.valB = p.select('#lissajousBVal', this.controls?.elt);
        this.sliderFreqA = p.select('#lissajousFreqA', this.controls?.elt); this.valFreqA = p.select('#lissajousFreqAVal', this.controls?.elt);
        this.sliderFreqB = p.select('#lissajousFreqB', this.controls?.elt); this.valFreqB = p.select('#lissajousFreqBVal', this.controls?.elt);
        this.sliderDelta = p.select('#lissajousDelta', this.controls?.elt); this.valDelta = p.select('#lissajousDeltaVal', this.controls?.elt);
        this.sliderTrail = p.select('#lissajousTrail', this.controls?.elt); this.valTrail = p.select('#lissajousTrailVal', this.controls?.elt);
        this.sliderSize = p.select('#lissajousSize', this.controls?.elt); this.valSize = p.select('#lissajousSizeVal', this.controls?.elt);

        // Attach listeners
        this.addListener(this.sliderA, 'input'); this.addListener(this.sliderB, 'input');
        this.addListener(this.sliderFreqA, 'input'); this.addListener(this.sliderFreqB, 'input');
        this.addListener(this.sliderDelta, 'input'); this.addListener(this.sliderTrail, 'input');
        this.addListener(this.sliderSize, 'input');

        // Initialize display
        this.updateParams();
    }

    // Helper to add listener and call updateParams
    addListener(element, eventType) {
        if (element) {
            element.input(() => this.updateParams());
        }
    }

    updateParams() {
        let needsReset = false; // Check if core parameters changed, requiring animation reset

        // Read values and check if they changed
        let newA = this.sliderA ? parseFloat(this.sliderA.value()) : this.a;
        if (newA !== this.a) { this.a = newA; needsReset = true; }
        if (this.valA) this.valA.html(this.a.toFixed(0));

        let newB = this.sliderB ? parseFloat(this.sliderB.value()) : this.b;
        if (newB !== this.b) { this.b = newB; needsReset = true; }
        if (this.valB) this.valB.html(this.b.toFixed(0));

        let newFreqA = this.sliderFreqA ? parseInt(this.sliderFreqA.value()) : this.freqA;
        if (newFreqA !== this.freqA) { this.freqA = newFreqA; needsReset = true; }
        if (this.valFreqA) this.valFreqA.html(this.freqA);

        let newFreqB = this.sliderFreqB ? parseInt(this.sliderFreqB.value()) : this.freqB;
        if (newFreqB !== this.freqB) { this.freqB = newFreqB; needsReset = true; }
        if (this.valFreqB) this.valFreqB.html(this.freqB);

        let newDelta = this.sliderDelta ? parseFloat(this.sliderDelta.value()) : this.delta;
        if (newDelta !== this.delta) { this.delta = newDelta; needsReset = true; }
        if (this.valDelta) this.valDelta.html(this.delta.toFixed(0));

        // Update animation-specific params without full reset
        if (this.sliderTrail) this.trailLength = parseInt(this.sliderTrail.value());
        if (this.valTrail) this.valTrail.html(this.trailLength);

        if (this.sliderSize) this.pointSize = parseInt(this.sliderSize.value());
        if (this.valSize) this.valSize.html(this.pointSize);

        // Reset animation if core shape parameters changed
        if (needsReset) {
            this.resetAnimation();
        }

        this.p.redraw(); // Always redraw when any param changes
    }

    resetAnimation() {
        this.points = [];
        this.currentTime = 0;
        console.log("Lissajous animation reset.");
    }

    draw(sharedState) {
        const p = this.p; // Use stored p5 instance

        // Parameter validation
        if (!isFinite(this.a) || !isFinite(this.b) || this.a <= 0 || this.b <= 0 ||
            !isFinite(this.freqA) || !isFinite(this.freqB) || !isFinite(this.delta) ||
            !isFinite(this.trailLength) || !isFinite(this.pointSize)) {
            console.error("Invalid parameters for drawLissajous.");
            p.push(); p.fill(255, 0, 100); p.textAlign(p.CENTER); p.textSize(16);
            p.text("Invalid Lissajous Parameters", 0, 0); // Centered due to main draw translate
            p.pop();
            return;
        }

        // Scale amplitudes based on canvas size
        let maxAmp = Math.max(this.a, this.b);
        let scaleFactor = maxAmp > 0 ? (p.height * 0.45) / maxAmp : 1; // Use 45% of height, prevent div by zero
        let drawA = this.a * scaleFactor;
        let drawB = this.b * scaleFactor;

        p.push(); // Isolate drawing styles

        if (sharedState.animate) {
            // --- Animated Drawing ---
            this.currentTime += sharedState.speed * 0.5; // Increment time (adjust multiplier for speed)

            // Calculate current point
            let t = this.currentTime;
            let currentX = drawA * p.sin(this.freqA * t + this.delta);
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
                let alpha = p.map(i, 0, this.points.length - 1, 0.1, 1.0); // Fade alpha
                p.strokeWeight(this.pointSize);
                p.stroke(60, 80, brightness, alpha); // Yellow, fading
                p.point(pt.x, pt.y);
            }

        } else {
            // --- Static Drawing ---
            // Reset animation state if switched from animated
            if (this.points.length > 0 || this.currentTime !== 0) {
                this.resetAnimation();
            }

            p.strokeWeight(1.5);
            p.stroke(60, 80, 100); // Bright Yellow
            p.noFill();
            p.beginShape();
            let maxT = 360; // Degrees
            let stepT = 1;
            for (let t = 0; t <= maxT; t += stepT) {
                let x = drawA * p.sin(this.freqA * t + this.delta);
                let y = drawB * p.sin(this.freqB * t);
                p.vertex(x, y);
            }
            // Close shape nicely for integer frequencies
            if (Number.isInteger(this.freqA) && Number.isInteger(this.freqB)) {
                 let x0 = drawA * p.sin(this.freqA * 0 + this.delta);
                 let y0 = drawB * p.sin(this.freqB * 0);
                 p.vertex(x0, y0); // Connect back to start
            }
            p.endShape();
        }

        p.pop(); // Restore drawing styles
    }

    // --- Interface Methods for main.js ---
    getDisplayName() { return "Lissajous Curves"; }
    getFormula() { return `x = A&sdot;sin(a&sdot;t + &delta;), y = B&sdot;sin(b&sdot;t)`; }
    getExplanation() { return `<h3>Lissajous Curves</h3><p>These curves describe...</p><ul>...</ul>`; } // Keep full text
    isAnimatable() { return true; } // This one *can* be animated

    showControls() { if (this.controls) this.controls.addClass('active'); }
    hideControls() { if (this.controls) this.controls.removeClass('active'); }
    activate() { this.resetAnimation(); this.p.redraw(); /* Reset on activation */ }

} // End class LissajousVisualization