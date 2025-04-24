// main.js - Main p5.js sketch using modules

// Import p5 instance for convenience if needed globally (or rely on instance passed)
// import p5 from './p5.min.js'; // If using p5 as a module (requires setup)

// Import visualization modules
import FlowerVisualization from './flower.js';
import LorenzVisualization from './lorenz.js';
// Import other visualizations here later
// import LissajousVisualization from './lissajous.js'; // Example

const sketch = (p) => {

    // --- Global State ---
    let currentVizKey = 'about';
    let animateViz = false;
    let animationSpeed = 1.0;
    let visualizations = {}; // Object to hold instances

    // --- DOM References ---
    let vizSelect, animateCheckbox, animSpeedSlider, animSpeedValSpan,
        vizNameSpan, vizFormulaHeaderSpan, titleContainer, animationControlsDiv,
        explanationContainerDiv, specificControlsContainer; // Added specific controls parent

    p.setup = () => {
        console.log("Main setup running...");
        let canvasContainer = p.select('#canvasContainer');
        let controlsContainer = p.select('#controls');
        titleContainer = p.select('#vizTitleContainer');
        let availableWidth = p.windowWidth - (controlsContainer ? controlsContainer.width : 300) - 60;
        let canvasWidth = Math.max(400, availableWidth);
        let availableHeight = p.windowHeight - (titleContainer ? titleContainer.height : 50) - 80;
        let canvasHeight = Math.min(500, availableHeight);
        let canvas = p.createCanvas(canvasWidth, canvasHeight);
        canvas.parent('canvasContainer');

        // Get General DOM elements
        vizSelect = p.select('#vizSelect');
        animateCheckbox = p.select('#animateCheck');
        animSpeedSlider = p.select('#animSpeed');
        animSpeedValSpan = p.select('#animSpeedVal');
        vizNameSpan = p.select('#vizName');
        vizFormulaHeaderSpan = p.select('#vizFormulaHeader');
        animationControlsDiv = p.select('.animation-controls');
        explanationContainerDiv = p.select('#explanationContainer');
        specificControlsContainer = p.select('#specificControlsContainer'); // Get parent for controls

        // Instantiate Visualization Modules
        // Pass p5 instance 'p' and the container for their specific controls
        try {
             visualizations['flower'] = new FlowerVisualization(p, p.select('#flowerControls'));
             visualizations['lorenz'] = new LorenzVisualization(p, p.select('#lorenzControls'));
             // visualizations['lissajous'] = new LissajousVisualization(p, p.select('#lissajousControls'));
             console.log("Visualization modules instantiated:", Object.keys(visualizations));
        } catch (e) {
            console.error("Error instantiating visualization modules:", e);
            // Handle error appropriately, maybe display message
        }


        // Attach Listeners to General Controls
        const addListener = (selector, event, handler) => {
            const elem = p.select(selector); if (elem) { elem[event](handler); } else { console.warn(`Element not found: ${selector}`); }
        };
        if (vizSelect) { vizSelect.changed(visualizationChanged); console.log("Dropdown listener attached."); }
        else { console.error("Could not find #vizSelect!"); }
        addListener('#animateCheck', 'changed', updateGeneralParams);
        addListener('#animSpeed', 'input', updateGeneralParams);

        // Initial UI setup
        currentVizKey = vizSelect.value(); // Get initial value from dropdown
        updateGeneralParams(); // Set initial general params state
        visualizationChanged(); // Setup UI for initial viz

        p.angleMode(p.DEGREES); p.colorMode(p.HSB, 360, 100, 100, 1);
        console.log("Main setup complete.");
    };

    p.draw = () => {
        p.background(0);

        // Draw sanity check dot
        p.push(); p.fill(0, 100, 100); p.noStroke(); p.ellipse(30, 30, 20, 20); p.pop();

        // Get the active visualization object
        const activeViz = visualizations[currentVizKey];

        if (activeViz && typeof activeViz.draw === 'function') {
            // Pass necessary shared state to the draw method
            activeViz.draw({
                animate: animateViz,
                speed: animationSpeed
            });
        } else if (currentVizKey === 'about') {
            // Draw 'about' text or leave blank
             p.push(); p.fill(0, 0, 80); p.textAlign(p.CENTER, p.CENTER); p.textSize(18);
             p.text("Select a visualization.", p.width / 2, p.height / 2);
             p.pop();
        } else {
             // Handle case where viz isn't found (shouldn't happen if dropdown/keys match)
             console.warn("No active drawing function found for:", currentVizKey);
             p.push(); p.fill(255,0,100); p.textAlign(p.CENTER, p.CENTER); p.textSize(18);
             p.text(`Error: Visualization "${currentVizKey}" not found.`, p.width / 2, p.height / 2);
             p.pop();
        }
    };

    // Handles changes to GENERAL controls (Animation checkbox, speed)
    function updateGeneralParams() {
        if (animateCheckbox) animateViz = animateCheckbox.checked();
        if (animSpeedSlider) animationSpeed = parseFloat(animSpeedSlider.value());
        if (animSpeedValSpan) animSpeedValSpan.html(animationSpeed.toFixed(1));

        // Redraw if animation state changed, but only if the current viz supports animation
        const activeViz = visualizations[currentVizKey];
        if (activeViz && activeViz.isAnimatable) {
             p.redraw();
        }
    }

    // Handles Dropdown Change
    function visualizationChanged() {
        if (!vizSelect) return;
        const newVizKey = vizSelect.value();
        console.log("Viz Changed Event. Selected:", newVizKey);
        currentVizKey = newVizKey; // Update the current key

        const activeViz = visualizations[currentVizKey];
        const displayName = activeViz?.getDisplayName ? activeViz.getDisplayName() : (currentVizKey === 'about' ? "About" : "Unknown");
        const formulaHTML = activeViz?.getFormula ? activeViz.getFormula() : (currentVizKey === 'about' ? "Select a visualization..." : "");

        // Update Header
        if (vizNameSpan) vizNameSpan.html(displayName);
        if (vizFormulaHeaderSpan) vizFormulaHeaderSpan.html(formulaHTML);
        if (titleContainer) { titleContainer.style('display', currentVizKey === 'about' ? 'none' : 'block'); }

        // Update Explanation
        const explanationHTML = activeViz?.getExplanation ? activeViz.getExplanation() : "";
        if (explanationContainerDiv) {
             try {
                 explanationContainerDiv.elt.innerHTML = explanationHTML;
                 explanationContainerDiv.style('display', (currentVizKey === 'about' || !explanationHTML) ? 'none' : 'block');
             } catch (e) { console.error("Error setting explanation HTML:", e); }
        }

        // Hide/Show Animation Controls based on module property
        const showAnim = activeViz?.isAnimatable ? activeViz.isAnimatable() : false;
        if (animationControlsDiv) { animationControlsDiv.style('display', showAnim ? 'block' : 'none'); }
        if (!showAnim && animateCheckbox) { animateCheckbox.checked(false); animateViz = false; }


        // Activate/Deactivate Specific Controls
        // Deactivate all first
        for (const key in visualizations) {
            visualizations[key].hideControls();
        }
        // Activate the selected one
        if (activeViz && typeof activeViz.showControls === 'function') {
            activeViz.showControls();
             console.log("Activated controls for:", currentVizKey);
             // Call activate method if it exists (e.g., to trigger initial calc)
             if(typeof activeViz.activate === 'function') {
                 activeViz.activate();
             }
        } else if (currentVizKey !== 'about') {
             console.warn("No controls found/show method for:", currentVizKey);
        }

        p.redraw(); // Trigger redraw for the new visualization
    }

}; // End sketch function wrapper

// Create the main p5 instance
new p5(sketch);