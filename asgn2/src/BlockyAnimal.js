// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  void main() {
    gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
  }`

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  } `

// global variables
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;
let u_ModelMatrix;
let u_GlobalRotateMatrix;

let g_lastX;
let g_lastY;
let g_pokeAnimation = false;
let g_pokeTime = 0;
let g_winkValue = 0;

function setupWebGL() {
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  // gl = getWebGLContext(canvas);
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true});
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  gl.enable(gl.DEPTH_TEST);
}

function connectVariablesToGLSL() {
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  // Get the storage location of u_ModelMatrix
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }

  // Get the storage location of u_GlobalRotateMatrix
  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  if (!u_GlobalRotateMatrix) {
    console.log('Failed to get the storage location of u_GlobalRotateMatrix');
    return;
  }

  // set an initial value for this matrix to identify
  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
}

// global variables related to UI elements
let g_globalAngle = 0;
let g_globalAngleY = 0;

let g_leftFrontLegAngle = 0;
let g_rightFrontLegAngle = 0;
let g_leftBackLegAngle = 0;
let g_rightBackLegAngle = 0;
let g_lflAnimation = false;
let g_rflAnimation = false;
let g_lblAnimation = false;
let g_rblAnimation = false;

let g_leftFrontShinAngle = 0;
let g_rightFrontShinAngle = 0;
let g_leftBackShinAngle = 0;
let g_rightBackShinAngle = 0;
let g_lfsAnimation = false;
let g_rfsAnimation = false;
let g_lbsAnimation = false;
let g_rbsAnimation = false;

let g_leftFrontFootAngle = 0;
let g_rightFrontFootAngle = 0;
let g_leftBackFootAngle = 0;
let g_rightBackFootAngle = 0;
let g_lffAnimation = false;
let g_rffAnimation = false;
let g_lbfAnimation = false;
let g_rbfAnimation = false;

// set up actions for the HTML UI elements
function addActionsForHtmlUI() {
  // button events
  // legs
  document.getElementById('animationLFLOffButton').onclick = function() { g_lflAnimation = false; };
  document.getElementById('animationLFLOnButton').onclick = function() { g_lflAnimation = true; };
  document.getElementById('animationRFLOffButton').onclick = function() { g_rflAnimation = false; };
  document.getElementById('animationRFLOnButton').onclick = function() { g_rflAnimation = true; };
  document.getElementById('animationLBLOffButton').onclick = function() { g_lblAnimation = false; };
  document.getElementById('animationLBLOnButton').onclick = function() { g_lblAnimation = true; };
  document.getElementById('animationRBLOffButton').onclick = function() { g_rblAnimation = false; };
  document.getElementById('animationRBLOnButton').onclick = function() { g_rblAnimation = true; };

  // shins
  document.getElementById('animationLFSOffButton').onclick = function() { g_lfsAnimation = false; };
  document.getElementById('animationLFSOnButton').onclick = function() { g_lfsAnimation = true; };
  document.getElementById('animationRFSOffButton').onclick = function() { g_rfsAnimation = false; };
  document.getElementById('animationRFSOnButton').onclick = function() { g_rfsAnimation = true; };
  document.getElementById('animationLBSOffButton').onclick = function() { g_lbsAnimation = false; };
  document.getElementById('animationLBSOnButton').onclick = function() { g_lbsAnimation = true; };
  document.getElementById('animationRBSOffButton').onclick = function() { g_rbsAnimation = false; };
  document.getElementById('animationRBSOnButton').onclick = function() { g_rbsAnimation = true; };

  // feet
  document.getElementById('animationLFFOffButton').onclick = function() { g_lffAnimation = false; };
  document.getElementById('animationLFFOnButton').onclick = function() { g_lffAnimation = true; };
  document.getElementById('animationRFFOffButton').onclick = function() { g_rffAnimation = false; };
  document.getElementById('animationRFFOnButton').onclick = function() { g_rffAnimation = true; };
  document.getElementById('animationLBFOffButton').onclick = function() { g_lbfAnimation = false; };
  document.getElementById('animationLBFOnButton').onclick = function() { g_lbfAnimation = true; };
  document.getElementById('animationRBFOffButton').onclick = function() { g_rbfAnimation = false; };
  document.getElementById('animationRBFOnButton').onclick = function() { g_rbfAnimation = true; };
  
  // slider events
  document.getElementById('leftFrontLegSlide').addEventListener('input',  function() { g_leftFrontLegAngle = this.value * -1; renderAllShapes(); });
  document.getElementById('rightFrontLegSlide').addEventListener('input',  function() { g_rightFrontLegAngle = this.value * -1; renderAllShapes(); });
  document.getElementById('leftBackLegSlide').addEventListener('input',  function() { g_leftBackLegAngle = this.value * -1; renderAllShapes(); });
  document.getElementById('rightBackLegSlide').addEventListener('input',  function() { g_rightBackLegAngle = this.value * -1; renderAllShapes(); });

  document.getElementById('leftFrontFootSlide').addEventListener('input',  function() { g_leftFrontFootAngle = this.value * -1; renderAllShapes(); });
  document.getElementById('rightFrontFootSlide').addEventListener('input',  function() { g_rightFrontFootAngle = this.value * -1; renderAllShapes(); });
  document.getElementById('leftBackFootSlide').addEventListener('input',  function() { g_leftBackFootAngle = this.value * -1; renderAllShapes(); });
  document.getElementById('rightBackFootSlide').addEventListener('input',  function() { g_rightBackFootAngle = this.value * -1; renderAllShapes(); });

  document.getElementById('leftFrontShinSlide').addEventListener('input',  function() { g_leftFrontShinAngle = this.value * -1; renderAllShapes(); });
  document.getElementById('rightFrontShinSlide').addEventListener('input',  function() { g_rightFrontShinAngle = this.value * -1; renderAllShapes(); });
  document.getElementById('leftBackShinSlide').addEventListener('input',  function() { g_leftBackShinAngle = this.value * -1; renderAllShapes(); });
  document.getElementById('rightBackShinSlide').addEventListener('input',  function() { g_rightBackShinAngle = this.value * -1; renderAllShapes(); });

  // size slider events
  document.getElementById('angleSlide').addEventListener('input', function() { g_globalAngle = this.value; renderAllShapes(); });
  document.getElementById('angleYSlide').addEventListener('input', function() { g_globalAngleY = this.value; renderAllShapes(); });
}

function main() {
  // set up canvas and gl variables
  setupWebGL();

  // set up GLSL shader programs and connect GLSL variables
  connectVariablesToGLSL();

  // set up actions for the HTML UI elements
  addActionsForHtmlUI();

  // Register function (event handler) to be called on a mouse press
  canvas.onmousedown = function(ev) {
    if (ev.shiftKey) {
        g_pokeAnimation = true;
        g_pokeTime = g_seconds;
    } else {
        g_lastX = ev.clientX;
        g_lastY = ev.clientY;
    }
  };
  canvas.onmousemove = function(ev) {
      if (ev.buttons == 1 && !ev.shiftKey) {
          g_globalAngle += (ev.clientX - g_lastX);
          g_globalAngleY += (ev.clientY - g_lastY);
          g_lastX = ev.clientX;
          g_lastY = ev.clientY;
          renderAllShapes();
      }
  };

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Render
  // gl.clear(gl.COLOR_BUFFER_BIT);
  // renderAllShapes();
  requestAnimationFrame(tick);
}

var g_startTime = performance.now()/1000.0;
var g_seconds = performance.now()/1000.0-g_startTime;

// called by browser repeatedly whenever it is time
function tick() {
  // save the current time
  g_seconds = performance.now()/1000.0-g_startTime;
  // print some debug information so we know we are running
  // console.log(g_seconds);

  // update animation angles
  updateAnimationAngles();

  // update poke animation
  updatePokeAnimation();

  // draw everything
  renderAllShapes();

  // tell the browser to update again when it has time
  requestAnimationFrame(tick);
}

// update the angles of everything if currently animated
function updateAnimationAngles() {
  if (g_lflAnimation) {
    g_leftFrontLegAngle  =  30 * Math.sin(2*g_seconds);
    g_leftFrontShinAngle = -30 * Math.sin(2*g_seconds);
    g_leftFrontFootAngle =  15 * Math.sin(2*g_seconds);
  } else {
    if (g_lfsAnimation) g_leftFrontShinAngle = -30 * Math.sin(2*g_seconds);
    if (g_lffAnimation) g_leftFrontFootAngle =  15 * Math.sin(2*g_seconds);
  }

  if (g_rflAnimation) {
    g_rightFrontLegAngle  = -30 * Math.sin(2*g_seconds);
    g_rightFrontShinAngle =  30 * Math.sin(2*g_seconds);
    g_rightFrontFootAngle = -15 * Math.sin(2*g_seconds);
  } else {
    if (g_rfsAnimation) g_rightFrontShinAngle =  30 * Math.sin(2*g_seconds);
    if (g_rffAnimation) g_rightFrontFootAngle = -15 * Math.sin(2*g_seconds);
  }

  if (g_lblAnimation) {
    g_leftBackLegAngle  =  30 * Math.sin(2*g_seconds);
    g_leftBackShinAngle = -30 * Math.sin(2*g_seconds);
    g_leftBackFootAngle =  15 * Math.sin(2*g_seconds);
  } else {
    if (g_lbsAnimation) g_leftBackShinAngle = -30 * Math.sin(2*g_seconds);
    if (g_lbfAnimation) g_leftBackFootAngle =  15 * Math.sin(2*g_seconds);
  }

  if (g_rblAnimation) {
    g_rightBackLegAngle  = -30 * Math.sin(2*g_seconds);
    g_rightBackShinAngle =  30 * Math.sin(2*g_seconds);
    g_rightBackFootAngle = -15 * Math.sin(2*g_seconds);
  } else {
    if (g_rbsAnimation) g_rightBackShinAngle =  30 * Math.sin(2*g_seconds);
    if (g_rbfAnimation) g_rightBackFootAngle = -15 * Math.sin(2*g_seconds);
  }
}

function updatePokeAnimation() {
  if (!g_pokeAnimation) return;

  var t = g_seconds - g_pokeTime;

  if (t > 2.0) {
      // reset everything after 2 seconds
      g_pokeAnimation = false;
      return;
  }

  // wink
  g_winkValue = t < 1.0 ? t : 2.0 - t;

  // running animation
  g_leftFrontLegAngle  =  60 * Math.sin(t * 8);
  g_rightFrontLegAngle = -60 * Math.sin(t * 8);
  g_leftBackLegAngle   =  60 * Math.sin(t * 8 + Math.PI);
  g_rightBackLegAngle  = -60 * Math.sin(t * 8 + Math.PI);

  g_leftFrontShinAngle  = -60 * Math.sin(t * 8);
  g_rightFrontShinAngle =  60 * Math.sin(t * 8);
  g_leftBackShinAngle   = -60 * Math.sin(t * 8 + Math.PI);
  g_rightBackShinAngle  =  60 * Math.sin(t * 8 + Math.PI);

  g_leftFrontFootAngle  =  45 * Math.sin(t * 12);
  g_rightFrontFootAngle = -45 * Math.sin(t * 12);
  g_leftBackFootAngle   =  45 * Math.sin(t * 12 + Math.PI);
  g_rightBackFootAngle  = -45 * Math.sin(t * 12 + Math.PI);
}

// draw every shape that is supposed to be in the canvas
function renderAllShapes() {
  // check the time at the start of this function
  var startTime = performance.now();

  // pass the matrix to u_ModelMatrix attribute
  var globalRotMat = new Matrix4().rotate(-g_globalAngle,0,1,0).rotate(-g_globalAngleY,1,0,0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // draw the body cube
  var body = new Cube();
  body.color = [1,1,1,1]; // white
  //body.matrix.translate(-0.25, -0.75, 0.0);
  body.matrix.translate(-0.25, -0.3, 0);
  //body.matrix.rotate(-5,1,0,0);
  body.matrix.scale(0.5, 0.45, 0.75);
  body.render();

  // draw the face cube
  var face = new Cube();
  face.color = [0.95, 0.85, 0.8,1]; // beige
  face.matrix.translate(-0.2,0,-0.2);
  face.matrix.scale(0.4,0.4,0.4);
  face.render();

  // hair - top of hair
  var hair = new Cube();
  hair.color = [1,1,1,1]; // white
  hair.matrix.translate(-0.225,0.26,-0.22);
  hair.matrix.scale(0.45,0.165,0.45);
  hair.render();

  // mullet - back of hair
  var mullet = new Cube();
  mullet.color = [1,1,1,1]; // white
  mullet.matrix.translate(-0.225, -0.1, 0.03);
  mullet.matrix.scale(0.45, 0.45, 0.2);
  mullet.render();

  // tail
  var tail = new Cube();
  tail.color = [1,1,1,1]; // white
  tail.matrix.translate(-0.085, 0.07, 0.68);
  tail.matrix.scale(0.15,0.1,0.15);
  tail.render();

  // eyes
  var leftEye = new Cube();
  leftEye.color = [0,0,0,1]; // black
  leftEye.matrix.translate(-0.2,0.2,-0.21);
  leftEye.matrix.scale(0.05, 0.05 * (1.0 - g_winkValue), 0.05);
  leftEye.render();

  var rightEye = new Cube();
  rightEye.color = [0,0,0,1]; // black
  rightEye.matrix.translate(0.15,0.2,-0.21);
  rightEye.matrix.scale(0.05,0.05,0.05);
  rightEye.render();

  // ears
  var leftEar = new Cube();
  leftEar.color = [1,1,1,1]; // white
  leftEar.matrix.translate(-0.37,0.28,-0.01);
  leftEar.matrix.rotate(45,1,-45,-20);
  leftEar.matrix.scale(0.25,0.1,0.05);
  leftEar.render();

  var rightEar = new Cube();
  rightEar.color = [1,1,1,1]; // white
  rightEar.matrix.translate(0.2,0.2,-0.01);
  rightEar.matrix.rotate(-45,1,-45,-20);
  rightEar.matrix.scale(0.25,0.1,0.05);
  rightEar.render();

  // party hat
  // cone
  var hat = new Cone();
  hat.color = [1, 0.2, 0.2, 1]; // red
  hat.matrix.translate(0, 0.35, -0.05);
  hat.matrix.scale(0.2, 0.3, 0.2);
  hat.render();

  // pompom
  var pompom = new Cube();
  pompom.color = [1,1,0,1]; // yellow
  pompom.matrix.translate(-0.025,0.61,-0.075);
  pompom.matrix.scale(0.05,0.05,0.05);
  pompom.render();

  // front legs
  // left leg
  var leftFrontLeg = new Cube();
  leftFrontLeg.color = [1,1,1,1]; // white
  leftFrontLeg.matrix.setTranslate(-0.25, -0.2, 0);
  leftFrontLeg.matrix.rotate(100,1,0,0);
  leftFrontLeg.matrix.rotate(g_leftFrontLegAngle, 1,0,0);
  var leftFrontLegCoordMat = new Matrix4(leftFrontLeg.matrix);
  leftFrontLeg.matrix.scale(0.15, 0.15, 0.25);
  leftFrontLeg.render();

  // left shin
  var leftFrontShin = new Cube();
  leftFrontShin.color = [0.9,0.9,0.9,1];
  leftFrontShin.matrix = leftFrontLegCoordMat;
  leftFrontShin.matrix.translate(0, 0, 0.2);
  leftFrontShin.matrix.rotate(g_leftFrontShinAngle, 1,0,0);
  var leftFrontShinCoordMat = new Matrix4(leftFrontShin.matrix);
  leftFrontShin.matrix.scale(0.13, 0.13, 0.1);
  leftFrontShin.render();

  // left foot
  var leftFrontFoot = new Cube();
  leftFrontFoot.color = [0.95, 0.85, 0.8,1];
  leftFrontFoot.matrix = leftFrontShinCoordMat;
  leftFrontFoot.matrix.translate(0, 0, -0.1);
  leftFrontFoot.matrix.translate(0,0,0.2);
  leftFrontFoot.matrix.rotate(g_leftFrontFootAngle -30, 1,0,0);
  leftFrontFoot.matrix.scale(0.15, 0.1, 0.2);
  leftFrontFoot.render();

  // right leg
  var rightFrontLeg = new Cube();
  rightFrontLeg.color = [1,1,1,1]; // white
  rightFrontLeg.matrix.setTranslate(0.1, -0.2, 0);
  rightFrontLeg.matrix.rotate(100,1,0,0);
  rightFrontLeg.matrix.rotate(g_rightFrontLegAngle, 1,0,0);
  var rightFrontLegCoordMat = new Matrix4(rightFrontLeg.matrix);
  rightFrontLeg.matrix.scale(0.15, 0.15, 0.2);
  rightFrontLeg.render();

  // right shin
  var rightFrontShin = new Cube();
  rightFrontShin.color = [0.9,0.9,0.9,1];
  rightFrontShin.matrix = rightFrontLegCoordMat;
  rightFrontShin.matrix.translate(0, 0, 0.2);
  rightFrontShin.matrix.rotate(g_rightFrontShinAngle, 1,0,0);
  var rightFrontShinCoordMat = new Matrix4(rightFrontShin.matrix);
  rightFrontShin.matrix.scale(0.13, 0.13, 0.1);
  rightFrontShin.render();

  // right foot
  var rightFrontFoot = new Cube();
  rightFrontFoot.color = [0.95, 0.85, 0.8,1];
  rightFrontFoot.matrix = rightFrontShinCoordMat;
  rightFrontFoot.matrix.translate(0, 0, 0.1);
  rightFrontFoot.matrix.rotate(g_rightFrontFootAngle -30, 1,0,0);
  rightFrontFoot.matrix.scale(0.15, 0.1, 0.2);
  rightFrontFoot.render();

  // back legs
  // left leg
  var leftBackLeg = new Cube();
  leftBackLeg.color = [1,1,1,1];
  leftBackLeg.matrix.setTranslate(-0.25, -0.2, 0.63);
  leftBackLeg.matrix.rotate(100,1,0,0);
  leftBackLeg.matrix.rotate(g_leftBackLegAngle, 1,0,0);
  var leftBackLegCoordMat = new Matrix4(leftBackLeg.matrix);
  leftBackLeg.matrix.scale(0.15, 0.15, 0.2);
  leftBackLeg.render();

  // left shin
  var leftBackShin = new Cube();
  leftBackShin.color = [0.9,0.9,0.9,1];
  leftBackShin.matrix = leftBackLegCoordMat;
  leftBackShin.matrix.translate(0, 0, 0.2);
  leftBackShin.matrix.rotate(g_leftBackShinAngle, 1,0,0);
  var leftBackShinCoordMat = new Matrix4(leftBackShin.matrix);
  leftBackShin.matrix.scale(0.13, 0.13, 0.1);
  leftBackShin.render();

  // left foot
  var leftBackFoot = new Cube();
  leftBackFoot.color = [0.95, 0.85, 0.8,1];
  leftBackFoot.matrix = leftBackShinCoordMat;
  leftBackFoot.matrix.translate(0, 0, 0.1);
  leftBackFoot.matrix.rotate(g_leftBackFootAngle -30, 1,0,0);
  leftBackFoot.matrix.scale(0.15, 0.1, 0.2);
  leftBackFoot.render();

  // right leg
  var rightBackLeg = new Cube();
  rightBackLeg.color = [1,1,1,1];
  rightBackLeg.matrix.setTranslate(0.1, -0.2, 0.63);
  rightBackLeg.matrix.rotate(100,1,0,0);
  rightBackLeg.matrix.rotate(g_rightBackLegAngle, 1,0,0);
  var rightBackLegCoordMat = new Matrix4(rightBackLeg.matrix);
  rightBackLeg.matrix.scale(0.15, 0.15, 0.2);
  rightBackLeg.render();

  // right shin
  var rightBackShin = new Cube();
  rightBackShin.color = [0.9,0.9,0.9,1];
  rightBackShin.matrix = rightBackLegCoordMat;
  rightBackShin.matrix.translate(0, 0, 0.2);
  rightBackShin.matrix.rotate(g_rightBackShinAngle, 1,0,0);
  var rightBackShinCoordMat = new Matrix4(rightBackShin.matrix);
  rightBackShin.matrix.scale(0.13, 0.13, 0.1);
  rightBackShin.render();

  // right foot
  var rightBackFoot = new Cube();
  rightBackFoot.color = [0.95, 0.85, 0.8,1];
  rightBackFoot.matrix = rightBackShinCoordMat;
  rightBackFoot.matrix.translate(0, 0, 0.1);
  rightBackFoot.matrix.rotate(g_rightBackFootAngle -30, 1,0,0);
  rightBackFoot.matrix.scale(0.15, 0.1, 0.2);
  rightBackFoot.render();

  // check the time at the end of the function, and show on webpage
  var duration = performance.now() - startTime;
  sendTextToHtml("ms: " + Math.floor(duration) + " fps: " + Math.floor(10000/duration)/10, "numdot");
}

// set the text of a HTML element
function sendTextToHtml(text, htmlID) {
  var htmlElm = document.getElementById(htmlID);
  if (!htmlElm) {
    console.log("Failed to get " + htmlID + "from HTML");
    return;
  }
  htmlElm.innerHTML = text;
}
