# Creates the updated main.js file
main_js_content = """
// main.js - Main p5.js sketch using modules

// Import visualization modules
import FlowerVisualization from './flower.js';
import LorenzVisualization from './lorenz.js';
import LSystemVisualization from './lsystem.js';
import LissajousVisualization from './lissajous.js'; // <-- Uncommented

const sketch = (p) => {

    // --- Global State ---
    let currentVizKey = 'about';
    let animateViz = false;
    let animationSpeed = 1.0;
    let visualizations = {}; // Object to hold instances

    // --- DOM References ---
    let vizSelect, animateCheckbox, animSpeedSlider, animSpeedValSpan,
        vizNameSpan, vizFormulaHeaderSpan, titleContainer, animationControlsDiv,
        explanationContainerDiv, specificControlsContainer;

    // --- Content Maps (Reduced - Modules provide their own content now) ---
    const vizDisplayNames = { // Primarily for fallback/initial state
        about: "About",
        flower: "Polar Flower", // Can be fetched from module
        lorenz: "Lorenz Attractor", // Can be fetched from module
        lissajous: "Lissajous Curves", // Can be fetched from module
        lsystem: "L-System Generator" // Can be fetched from module
    };
    // Removed formulas and explanations maps - Handled by modules via getFormula()/getExplanation()

    p.setup = () => {
        console.log("Main setup running...");
        let canvasContainer = p.select('#canvasContainer');
        let controlsContainer = p.select('#controls');
        titleContainer = p.select('#vizTitleContainer');

        // Basic width calculation (adjust as needed)
        let availableWidth = p.windowWidth - (controlsContainer ? controlsContainer.width : 300) - 60; // Account for controls width and padding
        let canvasWidth = Math.max(400, availableWidth); // Ensure minimum width

        // Basic height calculation (adjust as needed)
        let availableHeight = p.windowHeight - (titleContainer ? titleContainer.height : 50) - 80; // Account for title height and padding
        let canvasHeight = Math.max(400, Math.min(600, availableHeight)); // Ensure min height, limit max height


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
        specificControlsContainer = p.select('#specificControlsContainer');

        // Instantiate Visualization Modules
        visualizations = {}; // Clear first
        try {
             visualizations['flower'] = new FlowerVisualization(p, p.select('#flowerControls'));
             visualizations['lorenz'] = new LorenzVisualization(p, p.select('#lorenzControls'));
             visualizations['lissajous'] = new LissajousVisualization(p, p.select('#lissajousControls')); // <-- Uncommented
             visualizations['lsystem'] = new LSystemVisualization(p, p.select('#lsystemControls'));
             console.log("Visualization modules instantiated:", Object.keys(visualizations));
        } catch (e) {
             console.error("Error instantiating visualization modules:", e);
             // Maybe display an error message to the user on the page?
        }

        // Attach Listeners to General Controls
        const addListener = (selector, event, handler) => {
            const elem = p.select(selector);
            if (elem) {
                elem[event](handler);
            } else {
                console.warn(`Element not found: ${selector}`);
            }
        };

        if (vizSelect) {
            vizSelect.changed(visualizationChanged);
            console.log("Dropdown listener attached.");
        } else {
            console.error("Could not find #vizSelect!");
        }
        addListener('#animateCheck', 'changed', updateGeneralParams);
        addListener('#animSpeed', 'input', updateGeneralParams);

        // Specific listeners are set up within the modules' constructors

        // Initial UI setup
        currentVizKey = vizSelect.value();
        updateGeneralParams(); // Set initial general param state from controls
        visualizationChanged(); // Setup UI based on initial dropdown value

        p.angleMode(p.DEGREES);
        p.colorMode(p.HSB, 360, 100, 100, 1);
        console.log("Main setup complete.");
    };

    p.draw = () => {
        p.background(0, 0, 10); // Slightly off-black background

        const activeViz = visualizations[currentVizKey];

        if (activeViz?.draw) {
            // Apply centering translate for 2D visualizations that need it
            // Lorenz handles its own scaling/translation, Lissajous is centered by its nature
            const needsCentering = (currentVizKey === 'flower' || currentVizKey === 'lsystem');
            if (needsCentering) {
                p.push();
                p.translate(p.width / 2, p.height / 2);
            }

            // Call the active visualization's draw method
            activeViz.draw({
                animate: animateViz,
                speed: animationSpeed
            });

            if (needsCentering) {
                p.pop();
            }
        } else if (currentVizKey === 'about') {
            p.push();
            p.fill(0, 0, 80);
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(18);
            p.text("Select a visualization from the Controls panel.", p.width / 2, p.height / 2);
            p.pop();
        } else if (currentVizKey && currentVizKey !== 'about') { // Only warn if key is not 'about' and viz not found
             console.warn("No active drawing function found or viz not instantiated for:", currentVizKey);
             p.push();
             p.fill(0, 100, 80); // Warning color (Red)
             p.textAlign(p.CENTER, p.CENTER);
             p.textSize(18);
             p.text(`Error: Visualization "${currentVizKey}" failed to load. Check console.`, p.width / 2, p.height / 2);
             p.pop();
        }
        // No need for the sanity check dot anymore
    };

    // Handles changes to GENERAL controls (Animation checkbox, speed)
    function updateGeneralParams() {
        if (animateCheckbox) animateViz = animateCheckbox.checked(); else animateViz = false;
        if (animSpeedSlider) animationSpeed = parseFloat(animSpeedSlider.value()); else animationSpeed = 1.0;
        if (animSpeedValSpan) animSpeedValSpan.html(animationSpeed.toFixed(1));

        const activeViz = visualizations[currentVizKey];
        // Redraw only if animation state changed for an animatable visualization
        if (activeViz?.isAnimatable && activeViz.isAnimatable()) {
             p.redraw();
        }
    }

    // Handles Dropdown Change - Updated to fetch content from modules
    function visualizationChanged() {
        if (!vizSelect) return;
        currentVizKey = vizSelect.value();
        console.log("Viz Changed:", currentVizKey);

        const activeViz = visualizations[currentVizKey]; // Get the specific viz object

        let displayName = "Unknown";
        let formulaHTML = "";
        let explanationHTML = "<p>Error loading details.</p>"; // Default error message
        let showAnimControls = false;

        if (currentVizKey === 'about') {
            displayName = "About";
            formulaHTML = "Select a visualization...";
            explanationHTML = `<p>Created by Joshua Prull, 2025. Select a visualization from the dropdown above to explore interactive mathematical concepts.</p><p>Use the controls that appear to adjust parameters and observe the changes in real-time. Some visualizations support animation.</p>`;
        } else if (activeViz) {
            // Fetch details directly from the module instance
            try {
                displayName = typeof activeViz.getDisplayName === 'function' ? activeViz.getDisplayName() : vizDisplayNames[currentVizKey] || "Unknown";
                formulaHTML = typeof activeViz.getFormula === 'function' ? activeViz.getFormula() : "";
                explanationHTML = typeof activeViz.getExplanation === 'function' ? activeViz.getExplanation() : "<p>No explanation available.</p>";
                showAnimControls = typeof activeViz.isAnimatable === 'function' ? activeViz.isAnimatable() : false;
            } catch (e) {
                console.error(`Error getting details from module ${currentVizKey}:`, e);
                // Keep default error messages set above
            }
        } else {
             // Handle case where the key is not 'about' but the visualization failed to load
             displayName = vizDisplayNames[currentVizKey] || currentVizKey;
             formulaHTML = "Error loading formula.";
             explanationHTML = `<p>Failed to load the '${displayName}' visualization module. Please check the browser console for errors.</p>`;
        }


        // Update Header
        if (vizNameSpan) vizNameSpan.html(displayName);
        if (vizFormulaHeaderSpan) vizFormulaHeaderSpan.html(formulaHTML);
        if (titleContainer) { titleContainer.style('display', currentVizKey === 'about' ? 'none' : 'block'); }

        // Update Explanation
        if (explanationContainerDiv) {
            try {
                explanationContainerDiv.elt.innerHTML = explanationHTML;
                explanationContainerDiv.style('display', (currentVizKey === 'about' || !explanationHTML) ? 'none' : 'block');
            } catch (e) {
                console.error("Error setting explanation HTML:", e);
                explanationContainerDiv.elt.innerText = "Error loading explanation.";
                explanationContainerDiv.style('display', 'block');
            }
        } else {
            console.warn("Explanation container not found");
        }

        // Show/Hide Animation Controls based on module property
        if (animationControlsDiv) { animationControlsDiv.style('display', showAnimControls ? 'block' : 'none'); }
        // Reset animation state when changing viz
        if (animateCheckbox) { animateCheckbox.checked(false); }
        animateViz = false; // Ensure animation is off by default on switch

        // Activate/Deactivate Specific Controls
        console.log("--- Activating Controls ---");
        const allVizControls = p.selectAll('.viz-controls');
        allVizControls.forEach(el => { el.removeClass('active'); }); // Hide all first

        console.log(`Attempting to activate controls for: ${currentVizKey}`);
        if (currentVizKey !== 'about' && activeViz) { // Check if activeViz exists
             // Use the controls element stored within the activeViz instance
             const activeControlDiv = activeViz.controls; // Assumes constructor saved the element reference
             if (activeControlDiv) {
                 activeControlDiv.addClass('active');
                 console.log("Successfully activated controls:", activeControlDiv.id());
                 // Call activate method on the specific instance if it exists
                 if (typeof activeViz.activate === 'function') {
                     try {
                        activeViz.activate();
                     } catch (e) {
                        console.error(`Error during activate() for ${currentVizKey}:`, e);
                     }
                 }
             } else {
                 console.warn(`!!! Control div reference not found within the '${currentVizKey}' visualization object.`);
                 // Fallback attempt using ID selector (less robust if module didn't get control div)
                 const fallbackControl = p.select('#' + currentVizKey + 'Controls');
                 if (fallbackControl) {
                     fallbackControl.addClass('active');
                     console.log("(Fallback) Successfully activated controls by ID:", fallbackControl.id());
                     // Still try to call activate if the viz object exists
                     if (activeViz && typeof activeViz.activate === 'function') {
                         activeViz.activate();
                     }
                 } else {
                     console.warn("!!! (Fallback) Failed to find control div with selector:", '#' + currentVizKey + 'Controls');
                 }
             }
        } else if (currentVizKey === 'about') {
            console.log("Hiding all specific controls for 'about'.");
        } else {
            console.warn(`Skipping control activation for '${currentVizKey}' because visualization object is missing.`);
        }
        console.log("--- Finished Activating Controls ---");


        // Ensure initial state is set correctly when activating a viz (e.g., flags, sliders)
        // The 'activate' method within each module should ideally handle this now.
        // We can leave the explicit checks below as a safeguard or remove if 'activate' is reliable.

        if (currentVizKey === 'lorenz' && activeViz && typeof activeViz.updateParams === 'function') {
             // Lorenz might need an initial param sync or recalc trigger beyond activate
             activeViz.updateParams(); // Ensures sliders/values match state just in case
             // 'activate' should already set needsRecalculation = true
        }
        if (currentVizKey === 'lsystem' && activeViz && typeof activeViz.updateControls === 'function') {
             // LSystem might need controls synced if presets changed angle etc.
             activeViz.updateControls();
             // 'activate' should already set needsGeneration = true and resetAnimation
        }
        if (currentVizKey === 'lissajous' && activeViz && typeof activeViz.updateParams === 'function') {
            // Lissajous might need sliders synced on activation
            activeViz.updateParams();
            // 'activate' should already reset the animation
        }
         if (currentVizKey === 'flower' && activeViz && typeof activeViz.updateParams === 'function') {
            // Flower might need sliders synced on activation
            activeViz.updateParams();
        }

        p.redraw(); // Always request redraw after changing viz
    }

}; // *** End sketch function wrapper ***

// *** Create the main p5 instance ***
new p5(sketch);

"""
# Create the file
try:
    with open("main.js", "w") as f:
        f.write(main_js_content)
    print("File 'main.js' created successfully.")
except Exception as e:
    print(f"Error creating file 'main.js': {e}")