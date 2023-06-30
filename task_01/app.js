let gl, program;
let vertexCount = 36;
let modelViewMatrix;

let eye = [0, 0, 0.1];
let at = [0, 0, 0];
let up = [0, 1, 0];

let theta = 3; //defined rotation angle (in degrees)

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

    // You should get rid of the line below eventually
    vertices = scale(0.5, vertices); 

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


    // Event listener for key presses
  document.addEventListener("keydown", function (event) {
    switch (event.key) {
      // Top-side view
      case "t":
      case "T":
        eye = [0, 1, 0];
        at = [0, 0, 0];
        up = [0, 0, -1];
        break;

      // Left-side view
      case "l":
      case "L":
        eye = [-1, 0, 0];
        at = [0, 0, 0];
        up = [0, 1, 0];
        break;

      // Front-side view
      case "f":
      case "F":
        eye = [0, 0, 1];
        at = [0, 0, 0];
        up = [0, 1, 0];
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

function render() { 
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mvm = lookAt(eye, at, up);

    gl.uniformMatrix4fv(modelViewMatrix, false, flatten(mvm));

    gl.drawElements(gl.TRIANGLES, vertexCount, gl.UNSIGNED_BYTE, 0);

    requestAnimationFrame(render);  //uncommented this line
}