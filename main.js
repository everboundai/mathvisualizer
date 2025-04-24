// main.js - Main p5.js sketch using modules

// Import visualization modules
import FlowerVisualization from './flower.js';
import LorenzVisualization from './lorenz.js';
import LissajousVisualization from './lissajous.js';
import LSystemVisualization from './lsystem.js';

const sketch = (p) => {

    // --- Global State ---
    let currentVizKey = 'about';
    let animateViz = false;
    let animationSpeed = 1.0;
    let visualizations = {};

    // --- DOM References ---
    let vizSelect, animateCheckbox, animSpeedSlider, animSpeedValSpan,
        vizNameSpan, vizFormulaHeaderSpan, titleContainer, animationControlsDiv,
        explanationContainerDiv, specificControlsContainer;

    // --- Content Maps ---
    const vizDisplayNames = { /* ... Identical ... */ };
    const formulas = { /* ... Identical ... */ };
    const explanations = { /* ... Identical ... */ };


    p.setup = () => { // ... (Setup identical - gets elements, instantiates viz, attaches listeners) ...
        console.log("Main setup running...");
        let canvasContainer = p.select('#canvasContainer'); let controlsContainer = p.select('#controls'); titleContainer = p.select('#vizTitleContainer');
        let availableWidth = p.windowWidth - (controlsContainer ? controlsContainer.width : 300) - 60; let canvasWidth = Math.max(400, availableWidth);
        let availableHeight = p.windowHeight - (titleContainer ? titleContainer.height : 50) - 80; let canvasHeight = Math.min(500, availableHeight);
        let canvas = p.createCanvas(canvasWidth, canvasHeight); canvas.parent('canvasContainer');

        // Get elements... (Ensure all IDs are correct)
        vizSelect = p.select('#vizSelect'); animateCheckbox = p.select('#animateCheck'); animSpeedSlider = p.select('#animSpeed'); animSpeedValSpan = p.select('#animSpeedVal');
        vizNameSpan = p.select('#vizName'); vizFormulaHeaderSpan = p.select('#vizFormulaHeader'); animationControlsDiv = p.select('.animation-controls'); explanationContainerDiv = p.select('#explanationContainer');
        specificControlsContainer = p.select('#specificControlsContainer');

        // Instantiate Visualization Modules
        visualizations = {};
        try {
             visualizations['flower'] = new FlowerVisualization(p, p.select('#flowerControls'));
             visualizations['lorenz'] = new LorenzVisualization(p, p.select('#lorenzControls'));
             visualizations['lissajous'] = new LissajousVisualization(p, p.select('#lissajousControls'));
             visualizations['lsystem'] = new LSystemVisualization(p, p.select('#lsystemControls')); // Ensure ID here matches HTML
             console.log("Visualization modules instantiated:", Object.keys(visualizations));
        } catch (e) { console.error("Error instantiating visualization modules:", e); }

        // Add Listeners...
        const addListener = (selector, event, handler) => { const elem = p.select(selector); if (elem) { elem[event](handler); } else { console.warn(`Element not found: ${selector}`); }};
        if (vizSelect) { vizSelect.changed(visualizationChanged); console.log("Dropdown listener attached."); } else { console.error("Could not find #vizSelect!"); }
        addListener('#animateCheck', 'changed', updateGeneralParams); addListener('#animSpeed', 'input', updateParams); // Changed animSpeed back to updateParams for simplicity now
        // Specific listeners are set up within the modules' constructors

        updateGeneralParams(); visualizationChanged();
        p.angleMode(p.DEGREES); p.colorMode(p.HSB, 360, 100, 100, 1);
        console.log("Main setup complete.");
    };

    p.draw = () => { // ... (Draw loop identical - calls activeViz.draw()) ...
        p.background(0);
        p.push(); p.fill(0, 100, 100); p.noStroke(); p.ellipse(30, 30, 20, 20); p.pop();

        const activeViz = visualizations[currentVizKey];
        if (activeViz?.draw) {
            const needsCentering = (currentVizKey === 'flower' || currentVizKey === 'lissajous' || currentVizKey === 'lsystem');
            if (needsCentering) { p.push(); p.translate(p.width / 2, p.height / 2); }
            activeViz.draw({ animate: animateViz, speed: animationSpeed });
            if (needsCentering) { p.pop(); }
        } else if (currentVizKey === 'about') { /* ... draw about text ... */ }
        else if (currentVizKey) { /* ... draw error text ... */ }
    };

    // Handles changes to GENERAL controls
    function updateGeneralParams() { // ... (Identical) ... }

    // Handles Dropdown Change
    function visualizationChanged() {
        if (!vizSelect) return;
        currentVizKey = vizSelect.value();
        console.log("Viz Changed:", currentVizKey);

        const activeViz = visualizations[currentVizKey];
        const displayName = activeViz?.getDisplayName ? activeViz.getDisplayName() : (currentVizKey === 'about' ? "About" : "Unknown");
        const formulaHTML = activeViz?.getFormula ? activeViz.getFormula() : (currentVizKey === 'about' ? "Select a visualization..." : "");

        // Update Header
        if (vizNameSpan) vizNameSpan.html(displayName);
        if (vizFormulaHeaderSpan) vizFormulaHeaderSpan.html(formulaHTML);
        if (titleContainer) { titleContainer.style('display', currentVizKey === 'about' ? 'none' : 'block'); }

        // Update Explanation
        const explanationHTML = explanations[currentVizKey] || "";
        if (explanationContainerDiv) { try { explanationContainerDiv.elt.innerHTML = explanationHTML; explanationContainerDiv.style('display', (currentVizKey === 'about' || !explanationHTML) ? 'none' : 'block'); } catch (e) { console.error("Error setting explanation HTML:", e); explanationContainerDiv.elt.innerText = "Error loading explanation."; explanationContainerDiv.style('display', 'block'); } } else { console.warn("Explanation container not found"); }

        // Show/Hide Animation Controls
        const showAnim = activeViz?.isAnimatable ? activeViz.isAnimatable() : false;
        if (animationControlsDiv) { animationControlsDiv.style('display', showAnim ? 'block' : 'none'); }
        if (!showAnim && animateCheckbox?.checked()) { animateCheckbox.checked(false); animateViz = false; } // Reset state too

        // Activate/Deactivate Specific Controls
        console.log("--- Activating Controls ---"); // DEBUG LOG
        const allVizControls = p.selectAll('.viz-controls');
        allVizControls.forEach(el => { el.removeClass('active'); }); // Hide all first
        console.log(`Attempting to select: #${currentVizKey}Controls`); // DEBUG LOG
        if (currentVizKey !== 'about') {
             const activeControl = p.select('#' + currentVizKey + 'Controls'); // Try to find the specific div
             if (activeControl) { // Check if it was found
                 activeControl.addClass('active'); // Add .active class to show it
                 console.log("Successfully activated controls:", activeControl.id()); // DEBUG LOG
                 if (activeViz && typeof activeViz.activate === 'function') {
                     activeViz.activate(); // Call activate method if needed
                 }
             } else {
                 console.warn("!!! Failed to find control div with selector:", '#' + currentVizKey + 'Controls'); // Log failure
             }
        } else {
            console.log("Hiding all specific controls for 'about'.");
        }
        console.log("--- Finished Activating Controls ---"); // DEBUG LOG


        // Set flags ONLY when switching TO the viz that needs it
        if (currentVizKey === 'lorenz' && activeViz) { activeViz.needsRecalculation = true; }
        if (currentVizKey === 'lsystem' && activeViz) { activeViz.needsGeneration = true; if(typeof activeViz.resetAnimation === 'function') activeViz.resetAnimation();}

        p.redraw();
    }

    function updateParams() { // No changes needed here from last version
        // ... reads params for active viz ...
        if (animateCheckbox) animateViz = animateCheckbox.checked(); if (animSpeedSlider) animationSpeed = parseFloat(animSpeedSlider.value()); if (animSpeedValSpan) animSpeedValSpan.html(animationSpeed.toFixed(1));
        let needsRecalc = false;
        try {
            if (currentVizKey === 'flower') { if (flowerASlider) flowerA = parseFloat(flowerASlider.value()); if (flowerAValSpan) flowerAValSpan.html(flowerA); if (flowerKSlider) flowerK = parseFloat(flowerKSlider.value()); if (flowerKValSpan) flowerKValSpan.html(flowerK.toFixed(1)); }
            else if (currentVizKey === 'lorenz') { let sigmaTemp = lorenzSigmaSlider ? parseFloat(lorenzSigmaSlider.value()) : lorenzSigma; let rhoTemp = lorenzRhoSlider ? parseFloat(lorenzRhoSlider.value()) : lorenzRho; let betaTemp = lorenzBetaSlider ? parseFloat(lorenzBetaSlider.value()) : lorenzBeta; let stepsTemp = lorenzStepsSlider ? parseInt(lorenzStepsSlider.value()) : lorenzNumSteps; let dtTemp = lorenzDtSlider ? parseFloat(lorenzDtSlider.value()) : lorenzDt; if (lorenzSigmaValSpan) lorenzSigmaValSpan.html(sigmaTemp.toFixed(1)); if (lorenzRhoValSpan) lorenzRhoValSpan.html(rhoTemp.toFixed(1)); if (lorenzBetaValSpan) lorenzBetaValSpan.html(betaTemp.toFixed(2)); if (lorenzStepsValSpan) lorenzStepsValSpan.html(stepsTemp); if (lorenzDtValSpan) lorenzDtValSpan.html(dtTemp.toFixed(3)); if (sigmaTemp !== lorenzSigma || rhoTemp !== lorenzRho || betaTemp !== lorenzBeta || stepsTemp !== lorenzNumSteps || dtTemp !== lorenzDt) { lorenzSigma = sigmaTemp; lorenzRho = rhoTemp; lorenzBeta = betaTemp; lorenzNumSteps = stepsTemp; lorenzDt = dtTemp; needsRecalc = true; visualizations['lorenz'].needsRecalculation = true;} } // Pass recalc flag to module state
            else if (currentVizKey === 'lissajous') { if (lissajousASlider) lissajousA = parseFloat(lissajousASlider.value()); if (lissajousAValSpan) lissajousAValSpan.html(lissajousA.toFixed(0)); if (lissajousBSlider) lissajousB = parseFloat(lissajousBSlider.value()); if (lissajousBValSpan) lissajousBValSpan.html(lissajousB.toFixed(0)); if (lissajousFreqASlider) lissajousFreqA = parseInt(lissajousFreqASlider.value()); if (lissajousFreqAValSpan) lissajousFreqAValSpan.html(lissajousFreqA); if (lissajousFreqBSlider) lissajousFreqB = parseInt(lissajousFreqBSlider.value()); if (lissajousFreqBValSpan) lissajousFreqBValSpan.html(lissajousFreqB); if (lissajousDeltaSlider) lissajousDelta = parseFloat(lissajousDeltaSlider.value()); if (lissajousDeltaValSpan) lissajousDeltaValSpan.html(lissajousDelta.toFixed(0)); /* Update lissajous module state */ if(visualizations['lissajous']) visualizations['lissajous'].updateParams(); } // Call module update
            else if (currentVizKey === 'lsystem') { /* Update lsystem module state */ if(visualizations['lsystem']) visualizations['lsystem'].updateParams(); } // Call module update
        } catch (e) { console.error("Error reading control values:", e); }
        if (animateViz && visualizations[currentVizKey]?.isAnimatable()) { p.redraw(); } else if (needsRecalc) { p.redraw(); } else if (currentVizKey === 'flower' || currentVizKey === 'lissajous') { p.redraw(); } // LSystem redraw handled internally
    }

     function restartLorenz() { if(visualizations['lorenz'] && typeof visualizations['lorenz'].restart === 'function') visualizations['lorenz'].restart(); } // Delegate to module


}; // End sketch function wrapper

new p5(sketch);