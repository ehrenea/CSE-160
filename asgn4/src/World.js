// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  precision mediump float;
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  attribute vec3 a_Normal;
  varying vec2 v_UV;
  varying vec3 v_Normal;
  varying vec4 v_VertPos;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_NormalMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
    v_Normal = normalize(vec3(u_NormalMatrix * vec4(a_Normal, 1)));
    v_VertPos = u_ModelMatrix * a_Position;
  }`

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  varying vec3 v_Normal;
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform sampler2D u_Sampler2;
  uniform int u_whichTexture;
  uniform vec3 u_lightPos;
  uniform vec3 u_cameraPos;
  varying vec4 v_VertPos;
  uniform bool u_lightOn;
  uniform bool u_spotLightOn;
  uniform vec3 u_spotLightPos;
  uniform vec3 u_spotLightDir;
  uniform float u_spotCutoff;
  void main() {
    if (u_whichTexture == -3) {                   // use normal debug color
      gl_FragColor = vec4((v_Normal + 1.0) / 2.0, 1.0);
    } else if (u_whichTexture == -2) {            // use color
      gl_FragColor = u_FragColor;
    } else if (u_whichTexture == -1) {            // use UV debug color
      gl_FragColor = vec4(v_UV,1.0,1.0);
    } else if (u_whichTexture == 0) {             // use texture0
      gl_FragColor = texture2D(u_Sampler0, v_UV);
    } else if (u_whichTexture == 1) {             // use texture1
      gl_FragColor = texture2D(u_Sampler1, v_UV);
    } else if (u_whichTexture == 2) {             // use texture2
      gl_FragColor = texture2D(u_Sampler2, v_UV);
    } else {                                      // error, put redish
      gl_FragColor = vec4(1,0.2,0.2,1);
    }

    vec3 lightVector = u_lightPos - vec3(v_VertPos);
    float r=length(lightVector);

    // red/green distance visualization
    //if (r<1.0) {
    //  gl_FragColor = vec4(1,0,0,1);
    //} else if (r<2.0) {
    // gl_FragColor = vec4(0,1,0,1);
    //}

    // light falloff visualization 1/r^2
    //gl_FragColor = vec4(vec3(gl_FragColor)/(r*r), 1);

    // N dot L
    vec3 L = normalize(lightVector);
    vec3 N = normalize(v_Normal);
    float nDotL = max(dot(N,L), 0.0);

    // reflection
    vec3 R = reflect(-L, N);

    // eye
    vec3 E = normalize(u_cameraPos - vec3(v_VertPos));

    // specular
    float specular = pow(max(dot(E, R), 0.0), 64.0 * 0.8);

    vec4 baseColor = gl_FragColor;

    vec3 diffuse = vec3(baseColor) * nDotL * 0.7;
    vec3 ambient = vec3(baseColor) * 0.2;

    vec3 finalColor = vec3(baseColor);

    if (u_lightOn) {
      if (u_whichTexture == 0) {
        finalColor = vec3(specular) + diffuse + ambient;
      } else {
        finalColor = diffuse + ambient;
      }
    }

    // spotlight
    vec3 spotVector = u_spotLightPos - vec3(v_VertPos);
    vec3 spotL = normalize(spotVector);

    float spotEffect = dot(normalize(-spotL), normalize(u_spotLightDir));

    if (u_spotLightOn && spotEffect > u_spotCutoff) {
      float spotNDotL = max(dot(N, spotL), 0.0);
      vec3 spotDiffuse = vec3(baseColor) * spotNDotL * 0.7;
      finalColor += spotDiffuse;
    }

    gl_FragColor = vec4(finalColor, baseColor.a);
  } `

// global variables
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;
let u_ModelMatrix;
let u_NormalMatrix;
let u_ProjectionMatrix;
let u_ViewMatrix;
let u_GlobalRotateMatrix;
let u_Sampler0;
let u_Sampler1;
let u_Sampler2;
let u_whichTexture;
let u_lightPos;
let u_lightOn;
let u_spotLightOn;
let u_spotLightPos;
let u_spotLightDir;
let u_spotCutoff;

let g_lastX;
let g_lastY;
let g_keys = {};
let g_gameMessage = "Find all 3 carrots!";

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

  // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  // Get the storage location of a_UV
  a_UV = gl.getAttribLocation(gl.program, 'a_UV');
  if (a_UV < 0) {
    console.log('Failed to get the storage location of a_UV');
    return;
  }

  // Get the storage location of a_Normal
  a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
  if (a_Normal < 0) {
    console.log('Failed to get the storage location of a_Normal');
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

  // Get the storage location of u_NormalMatrix
  u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
  if (!u_NormalMatrix) {
    console.log('Failed to get the storage location of u_NormalMatrix');
    return;
  }

  // Get the storage location of u_GlobalRotateMatrix
  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  if (!u_GlobalRotateMatrix) {
    console.log('Failed to get the storage location of u_GlobalRotateMatrix');
    return;
  }

  // Get the storage location of u_ViewMatrix
  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  if (!u_ViewMatrix) {
    console.log('Failed to get the storage location of u_ViewMatrix');
    return;
  }

  // Get the storage location of u_ProjectionMatrix
  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  if (!u_ProjectionMatrix) {
    console.log('Failed to get the storage location of u_ProjectionMatrix');
    return;
  }

  // Get the storage location of u_Sampler
  u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
  if (!u_Sampler0) {
    console.log('Failed to get the storage location of u_Sampler0');
    return false;
  }

  u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
  if (!u_Sampler1) {
    console.log('Failed to get the storage location of u_Sampler1');
    return false;
  }

  u_Sampler2 = gl.getUniformLocation(gl.program, 'u_Sampler2');
  if (!u_Sampler2) {
    console.log('Failed to get the storage location of u_Sampler2');
    return false;
  }

  // Get the storage location of u_whichTexture
  u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');
  if (!u_whichTexture) {
    console.log('Failed to get the storage location of u_whichTexture');
    return false;
  }

  u_lightPos = gl.getUniformLocation(gl.program, 'u_lightPos');
  if (!u_lightPos) {
    console.log('Failed to get the storage location of u_lightPos');
    return false;
  }

  u_cameraPos = gl.getUniformLocation(gl.program, 'u_cameraPos');
  if (!u_cameraPos) {
    console.log('Failed to get the storage location of u_cameraPos');
    return false;
  }

  u_lightOn = gl.getUniformLocation(gl.program, 'u_lightOn');
  if (!u_lightOn) {
    console.log('Failed to get the storage location of u_lightOn');
    return false;
  }

  u_spotLightOn = gl.getUniformLocation(gl.program, 'u_spotLightOn');
  u_spotLightPos = gl.getUniformLocation(gl.program, 'u_spotLightPos');
  u_spotLightDir = gl.getUniformLocation(gl.program, 'u_spotLightDir');
  u_spotCutoff = gl.getUniformLocation(gl.program, 'u_spotCutoff');

  // set an initial value for this matrix to identify
  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
  gl.uniformMatrix4fv(u_NormalMatrix, false, identityM.elements);
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

let g_normalOn = false;
let g_lightOn = false;
let g_spotlightOn = false;
let g_lightPos = [0,1,-2];

// set up actions for the HTML UI elements
function addActionsForHtmlUI() {
  // button events
  document.getElementById('normalOn').onclick = function() { g_normalOn = true; renderAllShapes(); };
  document.getElementById('normalOff').onclick = function() { g_normalOn = false; renderAllShapes(); };
  document.getElementById('lightOn').onclick = function() { g_lightOn = true; renderAllShapes(); };
  document.getElementById('lightOff').onclick = function() { g_lightOn = false; renderAllShapes(); };
  document.getElementById('spotlightOn').onclick = function() { g_spotlightOn = true; renderAllShapes(); };
  document.getElementById('spotlightOff').onclick = function() { g_spotlightOn = false; renderAllShapes(); };

  // size slider events
  document.getElementById('lightSlideX').addEventListener('input', function() { g_lightPos[0] = this.value/100; renderAllShapes(); });
  document.getElementById('lightSlideY').addEventListener('input', function() { g_lightPos[1] = this.value/100; renderAllShapes(); });
  document.getElementById('lightSlideZ').addEventListener('input', function() { g_lightPos[2] = this.value/100; renderAllShapes(); });
  document.getElementById('angleSlide').addEventListener('input', function() { g_globalAngle = this.value; renderAllShapes(); });
  document.getElementById('angleYSlide').addEventListener('input', function() { g_globalAngleY = this.value; renderAllShapes(); });
}

function initTextures() {
  var image0 = new Image(); // create the image object
  if (!image0) {
    console.log('Failed to create the image object');
    return false;
  }

  var image1 = new Image(); // create the image object
  if (!image1) {
    console.log('Failed to create the image object');
    return false;
  }

  var image2 = new Image(); // create the image object
  if (!image2) {
    console.log('Failed to create the image object');
    return false;
  }

  // register the event handler to be called on loading an image
  image0.onload = function(){ sendImageToTEXTURE0(image0); }
  // tell the brower to load an image
  image0.src = 'grass.jpg';

  // register the event handler to be called on loading an image
  image1.onload = function(){ sendImageToTEXTURE1(image1)}
  // tell the brower to load an image
  image1.src = 'crate.jpg';

  // register the event handler to be called on loading an image
  image2.onload = function(){ sendImageToTEXTURE2(image2)}
  // tell the brower to load an image
  image2.src = 'red.jpg';

  console.log('image0 src:', image0.src);

  // add more texture loading
  return true;
}

function sendImageToTEXTURE0(image) {
  var texture = gl.createTexture(); // create texture object
  if (!texture) {
    console.log('Failed to create the texture object');
    return false;
  }
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // flip the image's y axis
  // enable texture unit0
  gl.activeTexture(gl.TEXTURE0);
  // bind the texture object to the target
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // set the texture parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  // set the texture image
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

  // set the texture unit 0 to be the sampler
  gl.uniform1i(u_Sampler0, 0);

  console.log('finished loadTexture');
}

function sendImageToTEXTURE1(image) {
  var texture = gl.createTexture(); // create texture object
  if (!texture) {
    console.log('Failed to create the texture object');
    return false;
  }
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // flip the image's y axis
  // enable texture unit0
  gl.activeTexture(gl.TEXTURE1);
  // bind the texture object to the target
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // set the texture parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  // set the texture image
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

  // set the texture unit 1 to be the sampler
  gl.uniform1i(u_Sampler1, 1);

  console.log('finished loadTexture');
}

function sendImageToTEXTURE2(image) {
  var texture = gl.createTexture(); // create texture object
  if (!texture) {
    console.log('Failed to create the texture object');
    return false;
  }
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // flip the image's y axis
  // enable texture unit0
  gl.activeTexture(gl.TEXTURE2);
  // bind the texture object to the target
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // set the texture parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  // set the texture image
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

  // set the texture unit 2 to be the sampler
  gl.uniform1i(u_Sampler2, 2);

  console.log('finished loadTexture');
}

function getBlockInFront() {
  var f = g_camera.at.subtract(g_camera.eye).normalize();
  var reach = 2;
  var x = Math.floor(g_camera.eye.x + f.x * reach + 16);
  var y = Math.floor(g_camera.eye.z + f.z * reach + 16);
  return {x: x, y: y};
}

function checkCarrotClick() {
  var f = g_camera.at.subtract(g_camera.eye).normalize();

  var checkX = g_camera.eye.x + f.x;
  var checkZ = g_camera.eye.z + f.z;

  for (let i = 0; i < g_carrots.length; i++) {
    let carrot = g_carrots[i];

    if (carrot.found) {
      continue;
    }

    let dx = checkX - carrot.x;
    let dz = checkZ - carrot.z;
    let distance = Math.sqrt(dx * dx + dz * dz);

    if (distance < 1.0) {
      carrot.found = true;
      g_carrotsFound++;

      g_gameMessage = "Carrots Found: " + g_carrotsFound + "/3";

      if (g_carrotsFound == 3) {
        g_gameMessage = "You found all 3 carrots!";
      }

      renderAllShapes();
      return;
    }
  }
}

let tree = new OBJModel();
let treeLoaded = false;

function main() {
  // set up canvas and gl variables
  setupWebGL();

  // set up GLSL shader programs and connect GLSL variables
  connectVariablesToGLSL();

  initTextures();

  // set up actions for the HTML UI elements
  addActionsForHtmlUI();

  fetch('tree.obj')
  .then(response => response.text())
  .then(data => {
    tree.loadOBJ(data);

    tree.color = [0, 1, 0, 1];
    tree.matrix.translate(-2, -0.5, 1);
    tree.matrix.scale(0.2, 0.2, 0.2);

    tree.normalMatrix.setInverseOf(tree.matrix).transpose();

    treeLoaded = true;
  })
  .catch(error => console.log("OBJ failed to load:", error));

  // Register function (event handler) to be called on a mouse press
  document.onkeydown = function(ev) {
    g_keys[ev.keyCode] = true;
  };

  document.onkeyup = function(ev) {
    g_keys[ev.keyCode] = false;
  };

  // removes cursor
  //canvas.onclick = function() {
  //  canvas.requestPointerLock();
  //};

  canvas.onmousedown = function(ev) {
    //if (document.pointerLockElement !== canvas) return;
    
    let dx = ev.movementX;
    let dy = ev.movementY;
    let xSensitivity = 0.03;
    let ySensitivity = 0.01;

    if (dx > 0) {
      for (let i = 0; i < Math.ceil(dx * xSensitivity); i++) g_camera.panRight();
    } else if (dx < 0) {
      for (let i = 0; i < Math.ceil(-dx * xSensitivity); i++) g_camera.panLeft();
    }

    if (dy != 0) {
        g_camera.panUp(-dy * ySensitivity);
    }

    renderAllShapes();
  };

  canvas.onmousedown = function(ev) {
    g_lastX = ev.clientX;

    // check carrots first
    checkCarrotClick();

    // right click = place block
    if (ev.button == 2) {
      var pos = getBlockInFront();

      if (pos.x >= 0 && pos.x < 32 && pos.y >= 0 && pos.y < 32) {
        if (g_map[pos.x][pos.y] < 4) {
          g_map[pos.x][pos.y] += 1;
        }
      }
    }

    // left click = remove block
    else if (ev.button == 0) {
      var pos = getBlockInFront();

      if (pos.x >= 0 && pos.x < 32 && pos.y >= 0 && pos.y < 32) {
        if (g_map[pos.x][pos.y] > 0) {
          g_map[pos.x][pos.y] -= 1;
        }
      }
    }

    renderAllShapes();
  };

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Render
  // gl.clear(gl.COLOR_BUFFER_BIT);
  renderAllShapes();
  requestAnimationFrame(tick);
}

var g_startTime = performance.now()/1000.0;
var g_seconds = performance.now()/1000.0-g_startTime;

// called by browser repeatedly whenever it is time
function tick() {
  // save the current time
  g_seconds = performance.now()/1000.0 - g_startTime;
  // print some debug information so we know we are running
  // console.log(g_seconds);

  // handle movement
  if (g_keys[87]) g_camera.forward();   // W
  if (g_keys[83]) g_camera.back();      // S
  if (g_keys[65]) g_camera.left();      // A
  if (g_keys[68]) g_camera.right();     // D
  if (g_keys[81]) g_camera.panLeft();   // Q
  if (g_keys[69]) g_camera.panRight();  // E

  updateAnimationAngles();
  renderAllShapes();
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

  g_lightPos[0] = Math.cos(g_seconds);
}

var g_camera = new Camera();

function keydown(ev) {
  if (ev.keyCode == 87) {         // W - forward
    g_camera.forward();
  } else if (ev.keyCode == 83) {  // S - back
    g_camera.back();
  } else if (ev.keyCode == 65) {  // A - left
    g_camera.left();
  } else if (ev.keyCode == 68) {  // D - right
    g_camera.right();
  } else if (ev.keyCode == 81) {  // Q - camera left
    g_camera.panLeft();
  } else if (ev.keyCode == 69) {  // E - camera right
    g_camera.panRight();
  } 

  renderAllShapes();
  console.log(ev.keyCode);
}

var g_map = [
  [4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4],
  [4,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,1,3,2,0,0,0,0,0,0,0,1,3,4],
  [4,1,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,4],
  [4,0,0,3,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,3,2,1,3,1,1,0,0,0,2,0,1,1,3,2,1,0,0,0,0,0,0,0,4,2,1,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,1,4,3,0,0,1,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,4],
  [4,0,0,1,0,0,2,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,4],
  [4,1,0,3,2,1,0,0,0,0,0,0,0,0,2,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,4],
  [4,3,2,1,3,1,1,0,0,0,0,0,1,1,3,2,1,0,0,0,0,0,1,3,4,0,1,0,0,0,0,4],
  [4,1,1,0,2,0,0,0,0,0,0,0,0,0,2,1,0,0,0,0,1,2,3,2,1,1,0,0,0,0,0,4],
  [4,0,0,0,1,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,3,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,2,1,0,0,0,0,0,0,4],
  [4,3,2,1,3,1,1,0,0,0,0,0,1,1,3,2,1,0,0,0,0,0,1,3,4,2,1,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,2,3,1,0,0,0,0,0,4],
  [4,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,2,0,0,0,4],
  [4,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,3,2,0,0,4],
  [4,0,2,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,4],
  [4,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,4],
  [4,0,0,3,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,2,3,0,0,0,0,0,1,4],
  [4,3,2,1,3,1,1,0,0,0,0,0,1,1,3,2,1,0,0,0,0,0,1,3,4,2,1,0,0,0,2,4],
  [4,2,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,2,0,0,0,3,4],
  [4,0,0,0,0,0,2,0,0,1,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,3,1,0,0,0,4],
  [4,0,1,3,0,0,0,0,0,0,1,0,0,0,2,1,0,0,0,0,0,0,0,0,0,0,0,2,0,0,1,4],
  [4,3,2,1,3,1,1,0,0,0,0,0,1,1,3,2,1,0,0,0,0,0,1,3,4,2,1,0,0,0,2,4],
  [4,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,2,0,0,0,2,3,0,0,0,0,0,0,4],
  [4,0,0,2,0,0,2,0,0,0,0,0,0,0,0,0,0,1,2,1,0,0,0,1,1,0,0,0,0,0,2,4],
  [4,0,1,3,2,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,2,1,0,0,0,0,0,0,4],
  [4,3,2,1,4,3,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,3,4,2,1,0,0,0,0,4],
  [4,0,0,1,0,0,0,0,0,0,0,0,0,1,2,0,0,0,2,0,0,0,0,2,2,0,1,0,0,0,1,4],
  [4,3,1,0,0,0,2,1,0,0,0,0,0,0,0,3,2,3,1,0,0,0,0,0,1,2,3,0,0,0,3,4],
  [4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4],
];

function drawMap() {
  for (var x = 0; x < 32; x++) {
    for (var y = 0; y < 32; y++) {
      var height = g_map[x][y];
      for (var h = 0; h < height; h++) {
        var cube = new Cube();
        cube.color = [1,1,1,1]; // default color is white
        if (x == 0 || x == 31 || y == 0 || y == 31) {
          cube.textureNum = 2;  // texture for outer wall
          //cube.color = [0.5,0.5,0.9,1];
          //cube.textureNum = -2;
        } else {
          //cube.textureNum = 1;  // texture for inner walls
          //cube.color = [0.9,0.2,0.5,1]; // dark pink
          cube.color = [0.5,0.5,0.9,1];
          cube.textureNum = -2;
        }
        if (g_normalOn) cube.textureNum = -3;
        cube.matrix.translate(x - 16, h - 0.75, y - 16);
        cube.renderfast();
      }
    }
  }
}

var g_carrots = [
  {x: 5,  z: 5,  found: false},
  {x: -9, z: 10, found: false},
  {x: 10, z: -6, found: false}
];

var g_carrotsFound = 0;

function drawCarrots() {
  for (let i = 0; i < g_carrots.length; i++) {
    let carrot = g_carrots[i];

    if (carrot.found) {
      continue;
    }

    // top of carrot
    let body1 = new Cube();
    body1.color = [1.0, 0.45, 0.0, 1.0];
    body1.textureNum = -2;
    if (g_normalOn) body1.textureNum = -3;
    body1.matrix.translate(carrot.x - 0.07, -0.1, carrot.z - 0.07);
    body1.matrix.scale(0.14, 0.15, 0.14);
    body1.render();

    // middle
    let body2 = new Cube();
    body2.color = [1.0, 0.5, 0.0, 1.0];
    body2.textureNum = -2;
    if (g_normalOn) body2.textureNum = -3;
    body2.matrix.translate(carrot.x - 0.055, -0.25, carrot.z - 0.055);
    body2.matrix.scale(0.11, 0.15, 0.11);
    body2.render();

    // tip
    let body3 = new Cube();
    body3.color = [1.0, 0.55, 0.0, 1.0];
    body3.textureNum = -2;
    if (g_normalOn) body3.textureNum = -3;
    body3.matrix.translate(carrot.x - 0.035, -0.38, carrot.z - 0.035);
    body3.matrix.scale(0.07, 0.13, 0.07);
    body3.render();

    let leaf1 = new Cube();
    leaf1.color = [0.1, 0.75, 0.2, 1.0];
    leaf1.textureNum = -2;
    if (g_normalOn) leaf1.textureNum = -3;
    leaf1.matrix.translate(carrot.x - 0.01, -0.05, carrot.z);
    leaf1.matrix.rotate(-35, 0, 0, 1);
    leaf1.matrix.scale(0.04, 0.22, 0.04);
    leaf1.render();

    let leaf2 = new Cube();
    leaf2.color = [0.05, 0.85, 0.15, 1.0];
    leaf2.textureNum = -2;
    if (g_normalOn) leaf2.textureNum = -3;
    leaf2.matrix.translate(carrot.x + 0.01, -0.05, carrot.z);
    leaf2.matrix.rotate(35, 0, 0, 1);
    leaf2.matrix.scale(0.04, 0.22, 0.04);
    leaf2.render();

    let leaf3 = new Cube();
    leaf3.color = [0.1, 0.8, 0.1, 1.0];
    leaf3.textureNum = -2;
    if (g_normalOn) leaf3.textureNum = -3;
    leaf3.matrix.translate(carrot.x, -0.05, carrot.z);
    leaf3.matrix.rotate(-35, 1, 0, 0);
    leaf3.matrix.scale(0.04, 0.22, 0.04);
    leaf3.render();
  }
}

let g_sheepX = 3;
let g_sheepY = 0;
let g_sheepZ = 0;

// draw every shape that is supposed to be in the canvas
function renderAllShapes() {
  // check the time at the start of this function
  var startTime = performance.now();

  // pass the projection matrix
  var projMat = new Matrix4();
  projMat.setPerspective(120, canvas.width/canvas.height, 0.1, 100);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMat.elements);

  // pass the view matrix
  var viewMat = new Matrix4();
  // viewMat.setLookAt(g_eye[0], g_eye[1], g_eye[2], g_at[0], g_at[1], g_at[2], g_up[0], g_up[1], g_up[2]); // (eye, at, up)
  viewMat.setLookAt(
    g_camera.eye.x, g_camera.eye.y, g_camera.eye.z,
    g_camera.at.x, g_camera.at.y, g_camera.at.z,
    g_camera.up.x, g_camera.up.y, g_camera.up.z
  );
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMat.elements);

  // pass the matrix to u_ModelMatrix attribute
  var globalRotMat = new Matrix4()
    .rotate(-g_globalAngle, 0, 1, 0)   // left/right
    .rotate(-g_globalAngleY, 1, 0, 0); // up/down
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // pass the light position to GLSL
  gl.uniform3f(u_lightPos, g_lightPos[0], g_lightPos[1], g_lightPos[2]);

  // pass the camera position to GLSL
  gl.uniform3f(u_cameraPos, g_camera.eye.x, g_camera.eye.y, g_camera.eye.z);

  // pass the light status
  gl.uniform1i(u_lightOn, g_lightOn);

  gl.uniform1i(u_spotLightOn, g_spotlightOn);
  gl.uniform3f(u_spotLightPos, 0, 3, 0);
  gl.uniform3f(u_spotLightDir, 0, -1, 0);
  gl.uniform1f(u_spotCutoff, Math.cos(15 * Math.PI / 180));

  // draw the light
  var light = new Cube();
  light.color = [2,2,0,1]; // yellow
  light.matrix.translate(g_lightPos[0], g_lightPos[1], g_lightPos[2]);
  light.matrix.scale(-0.1,-0.1,-0.1);
  light.matrix.translate(-0.5,-0.5,-0.5);
  light.render();

  // draw sphere
  var sph = new Sphere();
  sph.color = [1,1,1,1];
  if (g_normalOn) sph.textureNum = -3;
  sph.matrix.translate(0,0.2,-3);
  sph.render();

  // draw the floor
  var floor = new Cube();
  floor.color = [1.0,0.0,0.0,1.0];
  floor.textureNum = 0;
  if (g_normalOn) floor.textureNum = -3;
  floor.matrix.translate(0, -0.75, 0.0);
  floor.matrix.scale(32, 0.01, 32);
  floor.matrix.translate(-0.5, 0, -0.5);
  floor.render();

  if (treeLoaded) {
    tree.textureNum = g_normalOn ? -3 : -2;
    tree.render();
  }

  // draw map 
  drawMap();

  // draw carrots
  drawCarrots();

  // draw the sky
  var sky = new Cube();
  sky.color = [0.55, 0.81, 0.92, 1.0]; // blue
  //sky.textureNum = 1;
  if (g_normalOn) sky.textureNum = -3;
  sky.matrix.scale(-100,-100,-100);
  sky.matrix.translate(-0.5, -0.5, -0.5);
  sky.render();

  var sheepBase = new Matrix4();
  sheepBase.translate(g_sheepX, g_sheepY, g_sheepZ);
  sheepBase.rotate(145, 0,1,0);

  // draw the body cube
  var body = new Cube();
  body.color = [1,1,1,1]; // white
  if (g_normalOn) body.textureNum = -3;
  // body.textureNum = 0;
  body.matrix = new Matrix4(sheepBase);
  body.matrix.translate(-0.25, -0.3, 0);
  body.matrix.scale(0.5, 0.45, 0.75);
  body.render();

  // draw the face cube
  var face = new Cube();
  face.color = [0.95, 0.85, 0.8,1]; // beige
  if (g_normalOn) face.textureNum = -3;
  face.matrix = new Matrix4(sheepBase);
  face.matrix.translate(-0.2,0,-0.2);
  face.matrix.scale(0.4,0.4,0.4);
  face.render();

  // hair - top of hair
  var hair = new Cube();
  hair.color = [1,1,1,1]; // white
  if (g_normalOn) hair.textureNum = -3;
  hair.matrix = new Matrix4(sheepBase);
  hair.matrix.translate(-0.225,0.26,-0.22);
  hair.matrix.scale(0.45,0.165,0.45);
  hair.render();

  // mullet - back of hair
  var mullet = new Cube();
  mullet.color = [1,1,1,1]; // white
  if (g_normalOn) mullet.textureNum = -3;
  mullet.matrix = new Matrix4(sheepBase);
  mullet.matrix.translate(-0.225, -0.1, 0.03);
  mullet.matrix.scale(0.45, 0.45, 0.2);
  mullet.render();

  // tail
  var tail = new Cube();
  tail.color = [1,1,1,1]; // white
  if (g_normalOn) tail.textureNum = -3;
  tail.matrix = new Matrix4(sheepBase);
  tail.matrix.translate(-0.085, 0.07, 0.68);
  tail.matrix.scale(0.15,0.1,0.15);
  tail.render();

  // eyes
  var leftEye = new Cube();
  leftEye.color = [0,0,0,1]; // black
  if (g_normalOn) leftEye.textureNum = -3;
  leftEye.matrix = new Matrix4(sheepBase);
  leftEye.matrix.translate(-0.2,0.2,-0.21);
  leftEye.matrix.scale(0.05, 0.05, 0.05);
  leftEye.render();

  var rightEye = new Cube();
  rightEye.color = [0,0,0,1]; // black
  if (g_normalOn) rightEye.textureNum = -3;
  rightEye.matrix = new Matrix4(sheepBase);
  rightEye.matrix.translate(0.15,0.2,-0.21);
  rightEye.matrix.scale(0.05,0.05,0.05);
  rightEye.render();

  // ears
  var leftEar = new Cube();
  leftEar.color = [1,1,1,1]; // white
  if (g_normalOn) leftEar.textureNum = -3;
  leftEar.matrix = new Matrix4(sheepBase);
  leftEar.matrix.translate(-0.37,0.28,-0.01);
  leftEar.matrix.rotate(45,1,-45,-20);
  leftEar.matrix.scale(0.25,0.1,0.05);
  leftEar.render();

  var rightEar = new Cube();
  rightEar.color = [1,1,1,1]; // white
  if (g_normalOn) rightEar.textureNum = -3;
  rightEar.matrix = new Matrix4(sheepBase);
  rightEar.matrix.translate(0.2,0.2,-0.01);
  rightEar.matrix.rotate(-45,1,-45,-20);
  rightEar.matrix.scale(0.25,0.1,0.05);
  rightEar.render();

  // party hat
  var hat = new Cone();
  hat.color = [1, 0.2, 0.2, 1]; // red
  if (g_normalOn) hat.textureNum = -3;
  hat.matrix = new Matrix4(sheepBase);
  hat.matrix.translate(0, 0.35, -0.05);
  hat.matrix.scale(0.2, 0.3, 0.2);
  hat.render();

  // pompom
  var pompom = new Cube();
  pompom.color = [1,1,0,1]; // yellow
  if (g_normalOn) pompom.textureNum = -3;
  pompom.matrix = new Matrix4(sheepBase);
  pompom.matrix.translate(-0.025,0.61,-0.075);
  pompom.matrix.scale(0.05,0.05,0.05);
  pompom.render();

  // front legs
  // left leg
  var leftFrontLeg = new Cube();
  leftFrontLeg.color = [1,1,1,1]; // white
  if (g_normalOn) leftFrontLeg.textureNum = -3;
  leftFrontLeg.matrix = new Matrix4(sheepBase);
  leftFrontLeg.matrix.translate(-0.25, -0.2, 0);
  leftFrontLeg.matrix.rotate(100,1,0,0);
  leftFrontLeg.matrix.rotate(g_leftFrontLegAngle, 1,0,0);
  var leftFrontLegCoordMat = new Matrix4(leftFrontLeg.matrix);
  leftFrontLeg.matrix.scale(0.15, 0.15, 0.25);
  leftFrontLeg.normalMatrix.setInverseOf(leftFrontLeg.matrix).transpose();
  leftFrontLeg.render();

  // left shin
  var leftFrontShin = new Cube();
  leftFrontShin.color = [0.9,0.9,0.9,1];
  if (g_normalOn) leftFrontShin.textureNum = -3;
  leftFrontShin.matrix = new Matrix4(sheepBase);
  leftFrontShin.matrix = leftFrontLegCoordMat;
  leftFrontShin.matrix.translate(0, 0, 0.2);
  leftFrontShin.matrix.rotate(g_leftFrontShinAngle, 1,0,0);
  var leftFrontShinCoordMat = new Matrix4(leftFrontShin.matrix);
  leftFrontShin.matrix.scale(0.13, 0.13, 0.1);
  leftFrontShin.normalMatrix.setInverseOf(leftFrontShin.matrix).transpose();
  leftFrontShin.render();

  // left foot
  var leftFrontFoot = new Cube();
  leftFrontFoot.color = [0.95, 0.85, 0.8,1];
  if (g_normalOn) leftFrontFoot.textureNum = -3;
  leftFrontFoot.matrix = new Matrix4(sheepBase);
  leftFrontFoot.matrix = leftFrontShinCoordMat;
  leftFrontFoot.matrix.translate(0, 0, -0.1);
  leftFrontFoot.matrix.translate(0,0,0.2);
  leftFrontFoot.matrix.rotate(g_leftFrontFootAngle -30, 1,0,0);
  leftFrontFoot.matrix.scale(0.15, 0.1, 0.2);
  leftFrontFoot.normalMatrix.setInverseOf(leftFrontFoot.matrix).transpose();
  leftFrontFoot.render();

  // right leg
  var rightFrontLeg = new Cube();
  rightFrontLeg.color = [1,1,1,1]; // white
  if (g_normalOn) rightFrontLeg.textureNum = -3;
  rightFrontLeg.matrix = new Matrix4(sheepBase);
  rightFrontLeg.matrix.translate(0.1, -0.2, 0);
  rightFrontLeg.matrix.rotate(100,1,0,0);
  rightFrontLeg.matrix.rotate(g_rightFrontLegAngle, 1,0,0);
  var rightFrontLegCoordMat = new Matrix4(rightFrontLeg.matrix);
  rightFrontLeg.matrix.scale(0.15, 0.15, 0.2);
  rightFrontLeg.normalMatrix.setInverseOf(rightFrontLeg.matrix).transpose();
  rightFrontLeg.render();

  // right shin
  var rightFrontShin = new Cube();
  rightFrontShin.color = [0.9,0.9,0.9,1];
  if (g_normalOn) rightFrontShin.textureNum = -3;
  rightFrontShin.matrix = new Matrix4(sheepBase);
  rightFrontShin.matrix = rightFrontLegCoordMat;
  rightFrontShin.matrix.translate(0, 0, 0.2);
  rightFrontShin.matrix.rotate(g_rightFrontShinAngle, 1,0,0);
  var rightFrontShinCoordMat = new Matrix4(rightFrontShin.matrix);
  rightFrontShin.matrix.scale(0.13, 0.13, 0.1);
  rightFrontShin.normalMatrix.setInverseOf(rightFrontShin.matrix).transpose();
  rightFrontShin.render();

  // right foot
  var rightFrontFoot = new Cube();
  rightFrontFoot.color = [0.95, 0.85, 0.8,1];
  if (g_normalOn) rightFrontFoot.textureNum = -3;
  rightFrontFoot.matrix = new Matrix4(sheepBase);
  rightFrontFoot.matrix = rightFrontShinCoordMat;
  rightFrontFoot.matrix.translate(0, 0, 0.1);
  rightFrontFoot.matrix.rotate(g_rightFrontFootAngle -30, 1,0,0);
  rightFrontFoot.matrix.scale(0.15, 0.1, 0.2);
  rightFrontFoot.normalMatrix.setInverseOf(rightFrontFoot.matrix).transpose();
  rightFrontFoot.render();

  // back legs
  // left leg
  var leftBackLeg = new Cube();
  leftBackLeg.color = [1,1,1,1];
  if (g_normalOn) leftBackLeg.textureNum = -3;
  leftBackLeg.matrix = new Matrix4(sheepBase);
  leftBackLeg.matrix.translate(-0.25, -0.2, 0.63);
  leftBackLeg.matrix.rotate(100,1,0,0);
  leftBackLeg.matrix.rotate(g_leftBackLegAngle, 1,0,0);
  var leftBackLegCoordMat = new Matrix4(leftBackLeg.matrix);
  leftBackLeg.matrix.scale(0.15, 0.15, 0.2);
  leftBackLeg.normalMatrix.setInverseOf(leftBackLeg.matrix).transpose();
  leftBackLeg.render();

  // left shin
  var leftBackShin = new Cube();
  leftBackShin.color = [0.9,0.9,0.9,1];
  if (g_normalOn) leftBackShin.textureNum = -3;
  leftBackShin.matrix = new Matrix4(sheepBase);
  leftBackShin.matrix = leftBackLegCoordMat;
  leftBackShin.matrix.translate(0, 0, 0.2);
  leftBackShin.matrix.rotate(g_leftBackShinAngle, 1,0,0);
  var leftBackShinCoordMat = new Matrix4(leftBackShin.matrix);
  leftBackShin.matrix.scale(0.13, 0.13, 0.1);
  leftBackShin.normalMatrix.setInverseOf(leftBackShin.matrix).transpose();
  leftBackShin.render();

  // left foot
  var leftBackFoot = new Cube();
  leftBackFoot.color = [0.95, 0.85, 0.8,1];
  if (g_normalOn) leftBackFoot.textureNum = -3;
  leftBackFoot.matrix = new Matrix4(sheepBase);
  leftBackFoot.matrix = leftBackShinCoordMat;
  leftBackFoot.matrix.translate(0, 0, 0.1);
  leftBackFoot.matrix.rotate(g_leftBackFootAngle -30, 1,0,0);
  leftBackFoot.matrix.scale(0.15, 0.1, 0.2);
  leftBackFoot.normalMatrix.setInverseOf(leftBackFoot.matrix).transpose();
  leftBackFoot.render();

  // right leg
  var rightBackLeg = new Cube();
  rightBackLeg.color = [1,1,1,1];
  if (g_normalOn) rightBackLeg.textureNum = -3;
  rightBackLeg.matrix = new Matrix4(sheepBase);
  rightBackLeg.matrix.translate(0.1, -0.2, 0.63);
  rightBackLeg.matrix.rotate(100,1,0,0);
  rightBackLeg.matrix.rotate(g_rightBackLegAngle, 1,0,0);
  var rightBackLegCoordMat = new Matrix4(rightBackLeg.matrix);
  rightBackLeg.matrix.scale(0.15, 0.15, 0.2);
  rightBackLeg.normalMatrix.setInverseOf(rightBackLeg.matrix).transpose();
  rightBackLeg.render();

  // right shin
  var rightBackShin = new Cube();
  rightBackShin.color = [0.9,0.9,0.9,1];
  if (g_normalOn) rightBackShin.textureNum = -3;
  rightBackShin.matrix = new Matrix4(sheepBase);
  rightBackShin.matrix = rightBackLegCoordMat;
  rightBackShin.matrix.translate(0, 0, 0.2);
  rightBackShin.matrix.rotate(g_rightBackShinAngle, 1,0,0);
  var rightBackShinCoordMat = new Matrix4(rightBackShin.matrix);
  rightBackShin.matrix.scale(0.13, 0.13, 0.1);
  rightBackShin.normalMatrix.setInverseOf(rightBackShin.matrix).transpose();
  rightBackShin.render();

  // right foot
  var rightBackFoot = new Cube();
  rightBackFoot.color = [0.95, 0.85, 0.8,1];
  if (g_normalOn) rightBackFoot.textureNum = -3;
  rightBackFoot.matrix = new Matrix4(sheepBase);
  rightBackFoot.matrix = rightBackShinCoordMat;
  rightBackFoot.matrix.translate(0, 0, 0.1);
  rightBackFoot.matrix.rotate(g_rightBackFootAngle -30, 1,0,0);
  rightBackFoot.matrix.scale(0.15, 0.1, 0.2);
  rightBackFoot.normalMatrix.setInverseOf(rightBackFoot.matrix).transpose();
  rightBackFoot.render();

  // check the time at the end of the function, and show on webpage
  var duration = performance.now() - startTime;
  sendTextToHtml("ms: " + Math.floor(duration) + " fps: " + Math.floor(10000/duration)/10, "numdot");
  //sendTextToHtml(g_gameMessage, "gameText");
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
