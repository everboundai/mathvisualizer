// main.js - Main p5.js sketch using modules

// Import visualization modules
import FlowerVisualization from './flower.js';
import LorenzVisualization from './lorenz.js';
import LissajousVisualization from './lissajous.js';
import DeJongVisualization from './dejong.js';
import HenonVisualization from './henon.js';

const sketch = (p) => {
  // --- Global State ---
  let currentVizKey = 'about';
  let animateViz = false;
  let animationSpeed = 1.0;
  let visualizations = {};

  // --- DOM Refs ---
  let vizSelect, animateCheckbox, animSpeedSlider, animSpeedValSpan;
  let vizNameSpan, vizFormulaHeaderSpan, titleContainer;
  let animationControlsDiv, explanationContainerDiv;

  p.setup = () => {
    console.log('Main setup running...');
    const canvasContainer = p.select('#canvasContainer');
    const controlsContainer = p.select('#controls');
    titleContainer = p.select('#vizTitleContainer');

    // Determine canvas size
    const availW = p.windowWidth - (controlsContainer ? controlsContainer.width : 300) - 60;
    const canvasW = Math.max(400, availW);
    const availH = p.windowHeight - (titleContainer ? titleContainer.height : 50) - 80;
    const canvasH = Math.max(400, Math.min(600, availH));

    const canvas = p.createCanvas(canvasW, canvasH);
    canvas.parent('canvasContainer');

    // General controls
    vizSelect        = p.select('#vizSelect');
    animateCheckbox  = p.select('#animateCheck');
    animSpeedSlider  = p.select('#animSpeed');
    animSpeedValSpan = p.select('#animSpeedVal');
    vizNameSpan      = p.select('#vizName');
    vizFormulaHeaderSpan = p.select('#vizFormulaHeader');
    animationControlsDiv = p.select('.animation-controls');
    explanationContainerDiv = p.select('#explanationContainer');

    // Instantiate modules
    visualizations['flower']  = new FlowerVisualization(p, p.select('#flowerControls'));
    visualizations['lorenz']  = new LorenzVisualization(p, p.select('#lorenzControls'));
    visualizations['lissajous']= new LissajousVisualization(p, p.select('#lissajousControls'));
    visualizations['dejong']  = new DeJongVisualization(p, p.select('#dejongControls'));
    visualizations['henon']   = new HenonVisualization(p, p.select('#henonControls'));
    console.log('Visualization modules instantiated:', Object.keys(visualizations));

    // Attach listeners
    if (vizSelect) vizSelect.changed(visualizationChanged);
    animateCheckbox.changed(updateGeneralParams);
    animSpeedSlider.input(updateGeneralParams);

    // Initial UI
    currentVizKey = vizSelect.value();
    if (!visualizations[currentVizKey] && currentVizKey !== 'about') {
      currentVizKey = 'about';
      vizSelect.value(currentVizKey);
    }
    updateGeneralParams();
    visualizationChanged();

    p.angleMode(p.DEGREES);
    p.colorMode(p.HSB, 360, 100, 100, 1);
    console.log('Main setup complete.');
  };

  p.draw = () => {
    p.background(0, 0, 10);
    const activeViz = visualizations[currentVizKey];
    if (activeViz && typeof activeViz.draw === 'function') {
      // Center certain viz types
      const centerNeeded = (currentVizKey === 'flower' || currentVizKey === 'lissajous');
      if (centerNeeded) p.push(), p.translate(p.width/2, p.height/2);
      activeViz.draw({ animate: animateViz, speed: animationSpeed });
      if (centerNeeded) p.pop();
    } else if (currentVizKey === 'about') {
      p.push();
      p.fill(0,0,80);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(18);
      p.text('Select a visualization from the Controls panel.', p.width/2, p.height/2);
      p.pop();
    } else {
      p.push();
      p.fill(0,100,80);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(18);
      p.text(`Error loading viz '${currentVizKey}'.`, p.width/2, p.height/2);
      p.pop();
    }
  };

  function updateGeneralParams() {
    animateViz = animateCheckbox.checked();
    animationSpeed = parseFloat(animSpeedSlider.value());
    animSpeedValSpan.html(animationSpeed.toFixed(1));

    const activeViz = visualizations[currentVizKey];
    if (activeViz && activeViz.isAnimatable && activeViz.isAnimatable()) {
      animationControlsDiv.style('display','block');
      p.redraw();
    } else {
      animationControlsDiv.style('display','none');
    }
  }

  function visualizationChanged() {
    currentVizKey = vizSelect.value();
    const activeViz = visualizations[currentVizKey];

    // Header
    if (currentVizKey === 'about') {
      titleContainer.style('display','none');
    } else {
      titleContainer.style('display','block');
      vizNameSpan.html(activeViz.getDisplayName());
      vizFormulaHeaderSpan.html(activeViz.getFormula());
      explanationContainerDiv.elt.innerHTML = activeViz.getExplanation();
      explanationContainerDiv.style('display','block');
    }

    // Controls
    p.selectAll('.viz-controls').forEach(el => el.removeClass('active'));
    if (currentVizKey !== 'about' && activeViz) {
      const cdiv = p.select(`#${currentVizKey}Controls`);
      if (cdiv) cdiv.addClass('active');
      activeViz.activate();
    }
    updateGeneralParams();
    p.redraw();
  }
};

new p5(sketch);
