/*
Brad Pershon
CSE 5542 - Lab6
*/

//Shader setup
var gl;   
var aCoords_SB;         
var uProjection_SB;     
var uModelview_SB;
var prog_SB
var aCoords;          
var aNormal;
var uProjection;    
var uModelview;
var uNormalMatrix;
var uInvVT;
var prog;
var projection = mat4.create();   
var modelview;    
var normalMatrix = mat3.create();
var invVT = mat3.create();  
//Cubemap variables
var texID;   
var cube;    
//Camera control
var rotator;   
var rotX = 0, rotY = 0;  
//Geometry variables
var teapot;
var teapotVertexPositionBuffer;
var teapotVertexNormalBuffer; 
var teapotVertexTextureCoordBuffer; 
var teapotVertexIndexBuffer;
var loadObject = 0;
var xmin, xmax, ymin, ymax, zmin, zmax;

function webGLStart() {
   try {
        var canvas = document.getElementById("gl-canvas");
        gl = canvas.getContext("webgl");
        if ( ! gl ) {
            gl = canvas.getContext("experimental-webgl");
        }
        if ( ! gl ) {
            throw "Could not create WebGL context.";
        }
		initShaders();
        gl.enable(gl.DEPTH_TEST);
        rotator = new SimpleRotator(canvas,draw);
        rotator.setView( [0,0,1], [0,1,0], 40 );
        teapot = createModel(teapotModel);
        cube = createModelSB(cube(1000));
   }
   catch (e) {
      document.getElementById("message").innerHTML =
           "Error: Could not initialize WebGL: " + e;
      return;
   }
   loadTextureCube();
    document.addEventListener("keydown", doKey, false);
	initJSON();
   	draw();
}


 function draw() {
    gl.clearColor(0,0,0,1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    mat4.perspective(projection, Math.PI/3, 1, 10, 2000);
    modelview = rotator.getViewMatrix();
    mat3.normalFromMat4(normalMatrix, modelview);
    
    // Draw the skybox
    gl.useProgram(prog_SB);
    gl.uniformMatrix4fv(uProjection_SB, false, projection);
    if (texID) {
        gl.enableVertexAttribArray(aCoords_SB);
        cube.render();  
        gl.disableVertexAttribArray(aCoords_SB);
    }
    //Setup normal matrix
    mat3.fromMat4(invVT, modelview);
    mat3.invert(invVT,invVT);
    mat4.rotateX(modelview,modelview,rotX);
    mat4.rotateY(modelview,modelview,rotY);
    mat3.normalFromMat4(normalMatrix, modelview);
    
    // Draw Geometry
    gl.useProgram(prog); 
    gl.uniformMatrix4fv(uProjection, false, projection);
    if (texID) {
        gl.enableVertexAttribArray(aCoords);
        gl.enableVertexAttribArray(aNormal);
		if(loadObject == 0){
			teapot.render();
		}else if(loadObject == 1){
			drawJson();
		}
        gl.disableVertexAttribArray(aCoords);
        gl.disableVertexAttribArray(aNormal);
    }
}

function find_range(positions)
{
    xmin = xmax = positions[0];
    ymin = ymax = positions[1];
    zmin = zmax = positions[2];
    for (i = 0; i< positions.length/3; i++) {
	if (positions[i*3] < xmin) xmin = positions[i*3];
	if (positions[i*3] > xmax) xmax = positions[i*3]; 	

	if (positions[i*3+1] < ymin) ymin = positions[i*3+1];
	if (positions[i*3+1] > ymax) ymax = positions[i*3+1]; 	

	if (positions[i*3+2] < zmin) zmin = positions[i*3+2];
	if (positions[i*3+2] > zmax) zmax = positions[i*3+2]; 	
    }    
} 

//Loads json model
function initJSON()
{
    var request = new  XMLHttpRequest();
	request.open("GET", "macbook.json");
    request.onreadystatechange =
      function () {
          if (request.readyState == 4) {
	      console.log("state ="+request.readyState); 
              handleLoadedTeapot(JSON.parse(request.responseText));
        }
      }
    request.send();
}

function handleLoadedTeapot(teapotData)
{
    teapotVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(teapotData.vertexPositions),gl.STATIC_DRAW);
    teapotVertexPositionBuffer.itemSize=3;
    teapotVertexPositionBuffer.numItems=teapotData.vertexPositions.length/3; 
    
    teapotVertexNormalBuffer =  gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,  teapotVertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(teapotData.vertexNormals), gl.STATIC_DRAW);
    teapotVertexNormalBuffer.itemSize=3;
    teapotVertexNormalBuffer.numItems= teapotData.vertexNormals.length/3;

    teapotVertexTextureCoordBuffer=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexTextureCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(teapotData.vertexTextureCoords),
		  gl.STATIC_DRAW);
    teapotVertexTextureCoordBuffer.itemSize=2;
    teapotVertexTextureCoordBuffer.numItems=teapotData.vertexTextureCoords.length/2;

    teapotVertexIndexBuffer= gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, teapotVertexIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(teapotData.indices), gl.STATIC_DRAW);
    teapotVertexIndexBuffer.itemSize=1;
    teapotVertexIndexBuffer.numItems=teapotData.indices.length;

    find_range(teapotData.vertexPositions);    
    teapotVertexColorBuffer = teapotVertexNormalBuffer;
}

function drawJson(){
	    gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexPositionBuffer);
        gl.vertexAttribPointer(aCoords, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexNormalBuffer);
        gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);
        gl.uniformMatrix4fv(uModelview, false, modelview );
        gl.uniformMatrix3fv(uNormalMatrix, false, normalMatrix);
        gl.uniformMatrix3fv(uInvVT, false, invVT);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, teapotVertexIndexBuffer);
        gl.drawElements(gl.TRIANGLES, teapotVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
}

function loadTextureCube(urls) {
    var ct = 0;
    var img = new Array(6);
    var urls = [
       "rt.png", "lf.png", 
       "up.png", "dn.png", 
       "ft.png", "bk.png"
    ];
    for (var i = 0; i < 6; i++) {
        img[i] = new Image();
        img[i].onload = function() {
            ct++;
            if (ct == 6) {
                texID = gl.createTexture();
                gl.bindTexture(gl.TEXTURE_CUBE_MAP, texID);
                var targets = [
                   gl.TEXTURE_CUBE_MAP_POSITIVE_X, gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 
                   gl.TEXTURE_CUBE_MAP_POSITIVE_Y, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 
                   gl.TEXTURE_CUBE_MAP_POSITIVE_Z, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z 
                ];
                for (var j = 0; j < 6; j++) {
                    gl.texImage2D(targets[j], 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img[j]);
                    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                }
                gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
                draw();
            }
        }
        img[i].src = urls[i];
    }
}

//Function creates teapot model
function createModel(modelData) {  
    var model = {};
    model.coordsBuffer = gl.createBuffer();
    model.normalBuffer = gl.createBuffer();
    model.indexBuffer = gl.createBuffer();
    model.count = modelData.indices.length;
    gl.bindBuffer(gl.ARRAY_BUFFER, model.coordsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, modelData.vertexPositions, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, modelData.vertexNormals, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, modelData.indices, gl.STATIC_DRAW);
    model.render = function() {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.coordsBuffer);
        gl.vertexAttribPointer(aCoords, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);
        gl.uniformMatrix4fv(uModelview, false, modelview );
        gl.uniformMatrix3fv(uNormalMatrix, false, normalMatrix);
        gl.uniformMatrix3fv(uInvVT, false, invVT);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.drawElements(gl.TRIANGLES, this.count, gl.UNSIGNED_SHORT, 0);
    }
    return model;
}

//Function creates the skybox
function createModelSB(modelData) { 
    var model = {};
    model.coordsBuffer = gl.createBuffer();
    model.indexBuffer = gl.createBuffer();
    model.count = modelData.indices.length;
    gl.bindBuffer(gl.ARRAY_BUFFER, model.coordsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, modelData.vertexPositions, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, modelData.indices, gl.STATIC_DRAW);
    model.render = function() { 
        gl.bindBuffer(gl.ARRAY_BUFFER, this.coordsBuffer);
        gl.vertexAttribPointer(aCoords_SB, 3, gl.FLOAT, false, 0, 0);
        gl.uniformMatrix4fv(uModelview_SB, false, modelview );
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.drawElements(gl.TRIANGLES, this.count, gl.UNSIGNED_SHORT, 0);
    }
    return model;
}

function changeObject(x){
	loadObject = x;
	draw();
}

//Keyboard controls
function doKey(evt) {
    var rotationChanged = true;
	switch (evt.keyCode) {
	    case 37: rotY -= 0.15; break;        // left arrow
	    case 39: rotY +=  0.15; break;       // right arrow
	    case 38: rotX -= 0.15; break;        // up arrow
	    case 40: rotX += 0.15; break;        // down arrow
	    case 13: rotX = rotY = 0; break;  // return
	    case 36: rotX = rotY = 0; break;  // home
	    default: rotationChanged = false;
	}
	if (rotationChanged) {
     	     evt.preventDefault();
             draw();
	}
}


function createProgram(gl, vertexShaderSource, fragmentShaderSource) {
   var vsh = gl.createShader( gl.VERTEX_SHADER );
   gl.shaderSource(vsh,vertexShaderSource);
   gl.compileShader(vsh);
   if ( ! gl.getShaderParameter(vsh, gl.COMPILE_STATUS) ) {
      throw "Error: vertex shader:  " + gl.getShaderInfoLog(vsh);
   }
   var fsh = gl.createShader( gl.FRAGMENT_SHADER );
   gl.shaderSource(fsh, fragmentShaderSource);
   gl.compileShader(fsh);
   if ( ! gl.getShaderParameter(fsh, gl.COMPILE_STATUS) ) {
      throw "Error: fragment shader:  " + gl.getShaderInfoLog(fsh);
   }
   var prog = gl.createProgram();
   gl.attachShader(prog,vsh);
   gl.attachShader(prog, fsh);
   gl.linkProgram(prog);
   if ( ! gl.getProgramParameter( prog, gl.LINK_STATUS) ) {
      throw "Error: Linking:  " + gl.getProgramInfoLog(prog);
   }
   return prog;
}

function initShaders(){
 	var vertexShaderSource = getTextContent("vshaderSB"); 
  	var fragmentShaderSource = getTextContent("fshaderSB");
	prog_SB = createProgram(gl,vertexShaderSource,fragmentShaderSource);
	aCoords_SB =  gl.getAttribLocation(prog_SB, "coords");
	uModelview_SB = gl.getUniformLocation(prog_SB, "modelview");
	uProjection_SB = gl.getUniformLocation(prog_SB, "projection");
	vertexShaderSource = getTextContent("vshader"); 
	fragmentShaderSource = getTextContent("fshader");
	prog = createProgram(gl,vertexShaderSource,fragmentShaderSource);
	aCoords =  gl.getAttribLocation(prog, "coords");
	aNormal =  gl.getAttribLocation(prog, "normal");
	uModelview = gl.getUniformLocation(prog, "modelview");
	uProjection = gl.getUniformLocation(prog, "projection");
	uNormalMatrix = gl.getUniformLocation(prog, "normalMatrix");
	uInvVT = gl.getUniformLocation(prog, "invVT");
}

function getTextContent( elementID ) {
    var element = document.getElementById(elementID);
    var fsource = "";
    var node = element.firstChild;
    var str = "";
    while (node) {
        if (node.nodeType == 3) 
            str += node.textContent;
        node = node.nextSibling;
    }
    return str;
}

