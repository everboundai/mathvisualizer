// main.js - Main p5.js sketch using modules

// Import visualization modules
import FlowerVisualization from './flower.js';
import LorenzVisualization from './lorenz.js';
import LSystemVisualization from './lsystem.js'; // Import the simplified version
import LissajousVisualization from './lissajous.js';

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
    const vizDisplayNames = { about: "About" };

    p.setup = () => {
        // ... setup logic as before ...
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
        vizSelect = p.select('#vizSelect'); animateCheckbox = p.select('#animateCheck'); animSpeedSlider = p.select('#animSpeed'); animSpeedValSpan = p.select('#animSpeedVal');
        vizNameSpan = p.select('#vizName'); vizFormulaHeaderSpan = p.select('#vizFormulaHeader'); animationControlsDiv = p.select('.animation-controls');
        explanationContainerDiv = p.select('#explanationContainer'); specificControlsContainer = p.select('#specificControlsContainer');

        // Instantiate Visualization Modules... (as before)
        visualizations = {};
        try {
             visualizations['flower'] = new FlowerVisualization(p, p.select('#flowerControls'));
             visualizations['lorenz'] = new LorenzVisualization(p, p.select('#lorenzControls'));
             visualizations['lissajous'] = new LissajousVisualization(p, p.select('#lissajousControls'));
             visualizations['lsystem'] = new LSystemVisualization(p, p.select('#lsystemControls')); // Instantiates the simplified version
             console.log("Visualization modules instantiated:", Object.keys(visualizations));
        } catch (e) { console.error("Error instantiating visualization modules:", e); }

        // Attach Listeners... (as before)
        const addListener = (selector, event, handler) => { /* ... */ };
        if (vizSelect) { vizSelect.changed(visualizationChanged); } else { console.error("Could not find #vizSelect!"); }
        addListener('#animateCheck', 'changed', updateGeneralParams); addListener('#animSpeed', 'input', updateGeneralParams);

        // Initial UI setup... (as before)
        currentVizKey = vizSelect.value(); updateGeneralParams(); visualizationChanged();
        p.angleMode(p.DEGREES); p.colorMode(p.HSB, 360, 100, 100, 1); console.log("Main setup complete.");
    };

    p.draw = () => {
        p.background(0, 0, 10);
        const activeViz = visualizations[currentVizKey];

        if (activeViz?.draw) {
            // *** Apply centering for visualizations that need it (INCLUDES lsystem again) ***
            const needsCentering = (
                currentVizKey === 'flower' ||
                currentVizKey === 'lissajous' ||
                currentVizKey === 'lsystem' // <-- Added L-System back here
            );

            if (needsCentering) {
                p.push();
                p.translate(p.width / 2, p.height / 2);
            }

            // Call draw method
            activeViz.draw({ animate: animateViz, speed: animationSpeed });

            // Pop matrix if pushed
            if (needsCentering) { p.pop(); }

        } else if (currentVizKey === 'about') { /* ... about text ... */ }
        else if (currentVizKey && currentVizKey !== 'about') { /* ... error text ... */ }
    };

    // updateGeneralParams()... (as before)
    function updateGeneralParams() { /* ... */ }

    // visualizationChanged()... (as before)
    function visualizationChanged() { /* ... */ }

}; // *** End sketch function wrapper ***

// *** Create the main p5 instance ***
new p5(sketch);