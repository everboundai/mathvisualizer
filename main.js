// main.js - Main p5.js sketch using modules

// Import visualization modules
import FlowerVisualization from './flower.js';
import LorenzVisualization from './lorenz.js';
import LSystemVisualization from './lsystem.js';
import LissajousVisualization from './lissajous.js';

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

    // --- Content Maps (Minimal - Modules provide their own content) ---
    const vizDisplayNames = { // Primarily for fallback/initial state
        about: "About",
    };

    p.setup = () => {
        console.log("Main setup running...");
        let canvasContainer = p.select('#canvasContainer');
        let controlsContainer = p.select('#controls');
        titleContainer = p.select('#vizTitleContainer');

        let availableWidth = p.windowWidth - (controlsContainer ? controlsContainer.width : 300) - 60;
        let canvasWidth = Math.max(400, availableWidth);
        let availableHeight = p.windowHeight - (titleContainer ? titleContainer.height : 50) - 80;
        let canvasHeight = Math.max(400, Math.min(600, availableHeight));

        let canvas = p.createCanvas(canvasWidth, canvasHeight);
        canvas.parent('canvasContainer');

        // Get General DOM elements... (as before)
        vizSelect = p.select('#vizSelect');
        animateCheckbox = p.select('#animateCheck');
        animSpeedSlider = p.select('#animSpeed');
        animSpeedValSpan = p.select('#animSpeedVal');
        vizNameSpan = p.select('#vizName');
        vizFormulaHeaderSpan = p.select('#vizFormulaHeader');
        animationControlsDiv = p.select('.animation-controls');
        explanationContainerDiv = p.select('#explanationContainer');
        specificControlsContainer = p.select('#specificControlsContainer');


        // Instantiate Visualization Modules... (as before)
        visualizations = {}; // Clear first
        try {
             visualizations['flower'] = new FlowerVisualization(p, p.select('#flowerControls'));
             visualizations['lorenz'] = new LorenzVisualization(p, p.select('#lorenzControls'));
             visualizations['lissajous'] = new LissajousVisualization(p, p.select('#lissajousControls'));
             visualizations['lsystem'] = new LSystemVisualization(p, p.select('#lsystemControls'));
             console.log("Visualization modules instantiated:", Object.keys(visualizations));
        } catch (e) { console.error("Error instantiating visualization modules:", e); }


        // Attach Listeners to General Controls... (as before)
        const addListener = (selector, event, handler) => {
            const elem = p.select(selector);
            if (elem) { elem[event](handler); }
            else { console.warn(`Element not found: ${selector}`); }
        };
        if (vizSelect) { vizSelect.changed(visualizationChanged); console.log("Dropdown listener attached."); }
        else { console.error("Could not find #vizSelect!"); }
        addListener('#animateCheck', 'changed', updateGeneralParams);
        addListener('#animSpeed', 'input', updateGeneralParams);


        // Initial UI setup... (as before)
        currentVizKey = vizSelect.value();
        updateGeneralParams();
        visualizationChanged();


        p.angleMode(p.DEGREES);
        p.colorMode(p.HSB, 360, 100, 100, 1);
        console.log("Main setup complete.");
    };

    p.draw = () => {
        p.background(0, 0, 10);

        const activeViz = visualizations[currentVizKey];

        if (activeViz?.draw) {
            // *** Apply centering ONLY for visualizations that need it ***
            // Exclude lsystem as it now handles its own centering and scaling
            const needsCentering = (
                currentVizKey === 'flower' ||
                currentVizKey === 'lissajous'
                 // L-System removed from this list
            );

            if (needsCentering) {
                p.push();
                p.translate(p.width / 2, p.height / 2);
            }

            // Call the active visualization's draw method
            activeViz.draw({
                animate: animateViz,
                speed: animationSpeed
            });

            // Pop the translation matrix if it was pushed
            if (needsCentering) {
                p.pop();
            }
        } else if (currentVizKey === 'about') { /* ... about text ... */
            p.push(); p.fill(0, 0, 80); p.textAlign(p.CENTER, p.CENTER); p.textSize(18);
            p.text("Select a visualization from the Controls panel.", p.width / 2, p.height / 2); p.pop();
        } else if (currentVizKey && currentVizKey !== 'about') { /* ... error text ... */
             console.warn("Draw condition failed for:", currentVizKey);
             p.push(); p.fill(0, 100, 80); p.textAlign(p.CENTER, p.CENTER); p.textSize(18);
             p.text(`Error: Viz "${currentVizKey}" failed to load or draw. Check console.`, p.width / 2, p.height / 2); p.pop();
        }
    };

    // updateGeneralParams()... (as before)
    function updateGeneralParams() {
        if (animateCheckbox) animateViz = animateCheckbox.checked(); else animateViz = false;
        if (animSpeedSlider) animationSpeed = parseFloat(animSpeedSlider.value()); else animationSpeed = 1.0;
        if (animSpeedValSpan) animSpeedValSpan.html(animationSpeed.toFixed(1));
        const activeViz = visualizations[currentVizKey];
        if (activeViz?.isAnimatable && activeViz.isAnimatable()) { p.redraw(); }
    }


    // visualizationChanged()... (as before)
    function visualizationChanged() {
        if (!vizSelect) return; currentVizKey = vizSelect.value();
        console.log("Viz Changed:", currentVizKey);
        const activeViz = visualizations[currentVizKey];
        let displayName = "Unknown", formulaHTML = "", explanationHTML = "<p>Error loading details.</p>", showAnimControls = false;

        if (currentVizKey === 'about') { /* ... about details ... */
            displayName = "About"; formulaHTML = "Select a visualization...";
            explanationHTML = "<p>Created by Joshua Prull, 2025. Select a visualization to explore interactive math concepts. Use the controls to adjust parameters.</p>";
        } else if (activeViz) { /* ... get details from module ... */
            try {
                displayName = typeof activeViz.getDisplayName === 'function' ? activeViz.getDisplayName() : (vizDisplayNames[currentVizKey] || "Unknown");
                formulaHTML = typeof activeViz.getFormula === 'function' ? activeViz.getFormula() : "";
                explanationHTML = typeof activeViz.getExplanation === 'function' ? activeViz.getExplanation() : "<p>No explanation available.</p>";
                showAnimControls = typeof activeViz.isAnimatable === 'function' ? activeViz.isAnimatable() : false;
            } catch (e) { console.error(`Error getting details from module ${currentVizKey}:`, e); }
        } else { /* ... error details ... */
             displayName = vizDisplayNames[currentVizKey] || currentVizKey; formulaHTML = "Error loading formula.";
             explanationHTML = `<p>Failed to load the '${displayName}' visualization module. Check console.</p>`;
        }

        // Update Header/Explanation/Animation Controls... (as before)
        if (vizNameSpan) vizNameSpan.html(displayName);
        if (vizFormulaHeaderSpan) vizFormulaHeaderSpan.html(formulaHTML);
        if (titleContainer) { titleContainer.style('display', currentVizKey === 'about' ? 'none' : 'block'); }
        if (explanationContainerDiv) { try { explanationContainerDiv.elt.innerHTML = explanationHTML; explanationContainerDiv.style('display', (currentVizKey === 'about' || !explanationHTML) ? 'none' : 'block'); } catch (e) { console.error("Error setting explanation HTML:", e); explanationContainerDiv.elt.innerText = "Error loading explanation."; explanationContainerDiv.style('display', 'block'); } }
        if (animationControlsDiv) { animationControlsDiv.style('display', showAnimControls ? 'block' : 'none'); }
        if (animateCheckbox) { animateCheckbox.checked(false); } animateViz = false;


        // Activate/Deactivate Specific Controls... (as before)
        console.log("--- Activating Controls ---");
        const allVizControls = p.selectAll('.viz-controls'); allVizControls.forEach(el => { el.removeClass('active'); });
        console.log(`Attempting to activate controls for: ${currentVizKey}`);
        if (currentVizKey !== 'about' && activeViz) {
             const activeControlDiv = activeViz.controls;
             if (activeControlDiv) {
                 activeControlDiv.addClass('active'); console.log("Successfully activated controls:", activeControlDiv.id());
                 if (typeof activeViz.activate === 'function') { try { activeViz.activate(); } catch (e) { console.error(`Error during activate() for ${currentVizKey}:`, e); } }
             } else { /* ... fallback logic ... */
                 console.warn(`!!! Control div reference not found in '${currentVizKey}' object. Trying ID fallback.`);
                 const fallbackControl = p.select('#' + currentVizKey + 'Controls');
                 if (fallbackControl) { fallbackControl.addClass('active'); console.log("(Fallback) Successfully activated controls by ID:", fallbackControl.id()); if (activeViz && typeof activeViz.activate === 'function') { activeViz.activate(); } }
                 else { console.warn("!!! (Fallback) Failed to find control div with selector:", '#' + currentVizKey + 'Controls'); }
             }
        } else if (currentVizKey === 'about') { console.log("Hiding all specific controls for 'about'."); }
        else { console.warn(`Skipping control activation for '${currentVizKey}' (module missing).`); }
        console.log("--- Finished Activating Controls ---");


        // Safeguard calls to sync UI state after activation... (as before)
        if (activeViz) { if (typeof activeViz.updateParams === 'function') { activeViz.updateParams(); } if (typeof activeViz.updateControls === 'function') { activeViz.updateControls(); } }

        p.redraw();
    }

}; // *** End sketch function wrapper ***

// *** Create the main p5 instance ***
new p5(sketch);