//major changes:
//1: vertices now defined globally, not in the onload
//2: hardcoded camera coordinates for all options for better visualization
//3: buttons adjusted for both orthographic and perspective views
//4: moved all vBuffer, cBuffer and etc. to new created generateCube function
//5: added getCurrentProjectionMatrix to change between projection modes

let gl, program;
let vertexCount = 36;
let modelViewMatrix, projectionMatrix;

let projectionMode = 'perspective'; //initial mode set to perspective

let eye = [0, 0, 5]; // changed 0.1 to 5 for better visualization
let at = [0, 0, 0];
let up = [0, 1, 0];

let theta = 3; //defined rotation angle (in degrees - as function converts it to radians itself)

//initial clipping volume values
let left = 2;
let right = -2;
let bottom = 2;
let ytop = -2;
let near = 0.1;
let far = 100;

let fovy = 45; // initial fov value
let aspect = 400/300; //hardcoded it as our canvas is 400 by 300 in html

let vertices = [
  -1, -1, 1,
  -1, 1, 1,
  1, 1, 1,
  1, -1, 1,
  -1, -1, -1,
  -1, 1, -1,
  1, 1, -1,
  1, -1, -1,
];

let vertices2 = [ 
  3, -1, -1, 
  3, 1, -1, 
  5, 1, -1, 
  5, -1, -1, 
  3, -1, -3, 
  3, 1, -3, 
  5, 1, -3, 
  5, -1, -3, 
];

let indices = [
  0, 3, 1,
  1, 3, 2,
  4, 7, 5,
  5, 7, 6,
  3, 7, 2,
  2, 7, 6,
  4, 0, 5,
  5, 0, 1,
  1, 2, 5,
  5, 2, 6,
  0, 3, 4,
  4, 3, 7,
];

let colors = [
  0, 0, 0,
  0, 0, 1,
  0, 1, 0,
  0, 1, 1,
  1, 0, 0,
  1, 0, 1,
  1, 1, 0,
  1, 1, 1,
]; 

onload = () => {
    let canvas = document.getElementById("webgl-canvas");
    
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert('No webgl for you');
        return;
    }

    program = initShaders(gl, 'vertex-shader', 'fragment-shader');
    gl.useProgram(program);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.enable(gl.DEPTH_TEST);

    gl.clearColor(0, 0, 0, 0.5);

    // Event listener for key presses
  document.addEventListener("keydown", function (event) {
    switch (event.key) {
      // Top-side view
      case "t":
      case "T":
        if (projectionMode === 'orthogonal') {
          eye = [0, 1, 0];
          at = [0, 0, 0];
          up = [0, 0, -1];
        } else {
          eye = [0, 5, 0];
          at = [0, 0, 0];
          up = [0, 0, -1];
          fovy = 45;
        }
        break;

      // Left-side view
      case "l":
      case "L":
        if (projectionMode === 'orthogonal') {
          eye = [-1, 0, 0];
          at = [0, 0, 0];
          up = [0, 1, 0];
        } else {
          eye = [-5, 0, 0];
          at = [0, 0, 0];
          up = [0, 1, 0];
          fovy = 45;
        }
        
        break;

      // Front-side view
      case "f":
      case "F":
        if (projectionMode === 'orthogonal') {
          eye = [0, 0, 1];
          at = [0, 0, 0];
          up = [0, 1, 0];
        } else {
          eye = [0, 0, 5];
          at = [0, 0, 0];
          up = [0, 1, 0];
          fovy = 45;
        }
        break;

      // Rotate camera clockwise
      case "d":
      case "D":
        eye = rotateCamera(theta);
        break;

      // Rotate camera counter-clockwise     
      case "a":
      case "A":
        eye = rotateCamera(-theta);
        break;
      
      // Isometric view
      case "i":
        case "I":       
        eye = [5, 5, 5];
        at = [0, 0, 0];
        up = [0, 1, 0];
        fovy = 30;
        far = 100;
        near = 0.1;
        break;
      
      // in perspective view we zoom with the help of view.
      // Zoom in by adjusting clipping volume
      case "w":
        case "W":
          if (projectionMode === 'orthogonal') {
            left += 0.1;
            right -= 0.1;
            bottom += 0.1;
            ytop -= 0.1;
            near += 0.1;
            far -= 0.1;
          } else {
            fovy -= 1;
          }
        break;

      // Zoom out by adjusting clipping volume
      case "s":
      case "S":
        if (projectionMode === 'orthogonal') {
          left -= 0.1;
          right += 0.1;
          bottom -= 0.1;
          ytop += 0.1;
          near -= 0.1;
          far += 0.1;
        } else {
          fovy += 1;
        }
        break;
      
      //note that switching between views will make the view isometric ( for better visualization and time efficiency)
      //switch to orthogonal view
      case "o":
      case "O":
        eye = [1, 1, 1];
        at = [0, 0, 0];
        up = [0, 1, 0];
        left = -2;
        right = 2;
        bottom = -2;
        ytop = 2;
        near = -3;
        far = 3;
        projectionMode = 'orthogonal';
        break;
      //switch to perspective view
      case "p":
      case "P":
        eye = [5, 5, 5];
        at = [0, 0, 0];
        up = [0, 1, 0];
        left = 2;
        right = -2;
        bottom = 2;
        ytop = -2;
        near = 0.1;
        far = 100;
        fovy = 30;
        projectionMode = 'perspective';
        break;
    }});
    render();
};

// Function to rotate the camera
function rotateCamera(angle) {    // take rotation angle
  let rotationMatrix = rotate(angle, up);      // define axis of rotation. I used rotate function of mv library to generate rotation matrix with angle and up vectors
  let rotatedEye = mult(rotationMatrix, vec4(eye, 1.0));  // create homogenous vector of rotated position which achieved by multiplication of eye position with vector 

  // Convert the result back to vec3
  return vec3(rotatedEye[0], rotatedEye[1], rotatedEye[2]); // achieve new eye positions from exporting xyz values from homogenous vector
}

//function to get which view is used in projection matrix
function getCurrentProjectionMatrix() {
  if (projectionMode === 'orthogonal') {
    return ortho(left, right, bottom, ytop, near, far);
  } else {
    return perspective(fovy, aspect, near, far);
  }
}

//function for generating cubes
function generateCube(vertices){
  let vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    let vPosition = gl.getAttribLocation(program, 'vPosition');
    gl.vertexAttribPointer(vPosition,3,gl.FLOAT,false,0,0);
    gl.enableVertexAttribArray(vPosition);

    let iBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(indices), gl.STATIC_DRAW);

    let cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    let vColor = gl.getAttribLocation(program, 'vColor');
    gl.vertexAttribPointer(vColor,3,gl.FLOAT,false,0,0);
    gl.enableVertexAttribArray(vColor);

    modelViewMatrix = gl.getUniformLocation(program, 'modelViewMatrix');
    projectionMatrix = gl.getUniformLocation(program, 'projectionMatrix');

    gl.drawElements(gl.TRIANGLES, vertexCount, gl.UNSIGNED_BYTE, 0);

}

function render() { 
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mvm = lookAt(eye, at, up);
    pm = getCurrentProjectionMatrix();

    gl.uniformMatrix4fv(modelViewMatrix, false, flatten(mvm));
    gl.uniformMatrix4fv(projectionMatrix, false, flatten(pm));
    
    generateCube(vertices); //generate cube 1
    generateCube(vertices2); //generate cube 2

    requestAnimationFrame(render);
}
