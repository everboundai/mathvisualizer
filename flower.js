// flower.js - Module for Polar Flower Visualization

// Helper function (can be kept here or moved to a utils file)
function findLCMForFlower(k) {
    const tolerance = 1e-5;
    for (let den = 1; den <= 10; ++den) {
        const num = Math.round(k * den);
        if (Math.abs(k - num / den) < tolerance) {
            // Ensure LCM is calculated correctly for denominator for period
             let commonMultiple = (num !== 0 && den !== 0) ? Math.abs(num * den) / gcd(num, den) : 0;
             let period = commonMultiple !== 0 ? commonMultiple / num * 360 : 360; // Period in degrees
             // Simplified approach for now, ensure it covers enough for visual closure
             return den % 2 === 0 ? den * 180 : den * 360; // Loop enough degrees
            // return den % 2 === 0 ? den / 2 : den; // Old potentially incorrect period calc
        }
    }
    return 10 * 360; // Default loop angle if no simple fraction found
}
// Greatest Common Divisor helper
function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }


export default class FlowerVisualization {
    constructor(p, controlsElement) {
        this.p = p; // p5 instance
        this.controls = controlsElement; // Reference to #flowerControls div

        // State
        this.a = 150;
        this.k = 5;

        // Get specific controls from within the parent
        this.sliderA = p.select('#flowerA', this.controls.elt); // Search within parent
        this.valA = p.select('#flowerAVal', this.controls.elt);
        this.sliderK = p.select('#flowerK', this.controls.elt);
        this.valK = p.select('#flowerKVal', this.controls.elt);

        // Attach listeners
        if (this.sliderA) this.sliderA.input(() => this.updateParams());
        if (this.sliderK) this.sliderK.input(() => this.updateParams());

        // Initialize display
        this.updateParams();
    }

    updateParams() {
        if (this.sliderA) this.a = parseFloat(this.sliderA.value());
        if (this.sliderK) this.k = parseFloat(this.sliderK.value());

        if (this.valA) this.valA.html(this.a.toFixed(0));
        if (this.valK) this.valK.html(this.k.toFixed(1));

        this.p.redraw(); // Request redraw when params change
    }

    draw(sharedState) {
        const p = this.p; // Use stored p5 instance

        // Parameter validation
        if (!isFinite(this.a) || !isFinite(this.k) || this.a <= 0) {
             console.error("Invalid parameters for drawFlower. A:", this.a, "K:", this.k);
             p.push(); p.fill(255,0,100); p.textAlign(p.CENTER); p.textSize(16);
             p.text("Invalid Flower Parameters", 0, 0); // Centered due to translate in main draw()
             p.pop();
             return;
        }

        // Use shared state for animation
        let currentK = this.k;
        let currentA = this.a;
        if (sharedState.animate) {
            let timeFactor = p.frameCount * sharedState.speed;
            currentK = this.k + p.sin(timeFactor * 0.5) * 0.5;
            currentA = this.a + p.cos(timeFactor * 0.8) * 15;
        }
        let drawA = currentA;

        // Drawing logic
        p.push(); // Use push/pop for safety, though translate is now in main.js
        p.strokeWeight(1.5); p.noFill();
        let timeFactor = p.frameCount * sharedState.speed;
        let hue = (timeFactor * 0.2) % 360;
        p.stroke(sharedState.animate ? hue : 0, sharedState.animate ? 80 : 0, 100); // White or Color

        p.beginShape();
        let angleStep = 1;
        let endAngle = findLCMForFlower(currentK); // Use helper function
        for (let theta = 0; theta <= endAngle; theta += angleStep) {
            let r = drawA * p.cos(currentK * theta);
            // Check for invalid r values if k is tricky
            if (!isFinite(r)) continue;
            let x = r * p.cos(theta);
            let y = r * p.sin(theta);
            p.vertex(x, y);
        }
        p.endShape(p.CLOSE);
        p.pop();
    }

    getDisplayName() { return "Polar Flower"; }
    getFormula() { return `r = <span class="variable">a</span> &sdot; cos(<span class="variable">k</span> &sdot; &theta;)`; }
    getExplanation() { return `<h3>Polar Flower (Rose Curve)</h3><p>...</p><ul>...</ul>`; } // Keep full text
    isAnimatable() { return true; }

    showControls() { if (this.controls) this.controls.addClass('active'); }
    hideControls() { if (this.controls) this.controls.removeClass('active'); }
    activate() { this.p.redraw(); /* Trigger initial draw */ }

} // End class FlowerVisualization