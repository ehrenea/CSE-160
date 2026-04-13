// DrawRectangle.js
function main() {
    // Retrieve <canvas> element <- (1)
    var canvas = document.getElementById('example');
    if (!canvas) {
        console.log('Failed to retrieve the <canvas> element');
        return;
    }

    // Get the rendering context for 2DCG <- (2)
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, 400, 400); // 400x400 resolution

    // QUESTION 1
    // Draw a blue rectangle <- (3)
    // ctx.fillStyle = 'rgba(0, 0, 255, 1.0)'; // Set a blue color
    // ctx.fillRect(120, 10, 150, 150); // Fill a rectangle with the color

    // QUESTION 2
    // Draw a red vector
    var v1 = new Vector3([2.25, 2.25, 0]) // create v1
    drawVector(v1, "red");
}

// QUESTION 3
function drawVector(v, color) {
    var canvas = document.getElementById('example');
    var ctx = canvas.getContext('2d');

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.moveTo(200, 200); // origin of 400x400
    ctx.lineTo(200 + v.elements[0] * 20, 200 - v.elements[1] * 20); // scale by 20
    ctx.stroke();
}

// QUESTION 4
function handleDrawEvent() {
    var canvas = document.getElementById('example');
    var ctx = canvas.getContext('2d');

    // clear/reset canvas
    ctx.fillStyle = "#000000"
    ctx.fillRect(0, 0, 400, 400);

    // read values from text boxes
    // v1:
    var x1 = parseFloat(document.getElementById('xcord1').value);
    var y1 = parseFloat(document.getElementById('ycord1').value);
    var v1 = new Vector3([x1, y1, 0]);
    // v2:
    var x2 = parseFloat(document.getElementById('xcord2').value);
    var y2 = parseFloat(document.getElementById('ycord2').value);
    var v2 = new Vector3([x2, y2, 0]);

    drawVector(v1, "red");
    drawVector(v2, "blue");
}

// QUESTION 5/6
function handleDrawOperationEvent() {
    var canvas = document.getElementById('example');
    var ctx = canvas.getContext('2d');

    // clear/reset canvas
    ctx.fillStyle = "#000000"
    ctx.fillRect(0, 0, 400, 400);

    // read v1:
    var x1 = parseFloat(document.getElementById('xcord1').value);
    var y1 = parseFloat(document.getElementById('ycord1').value);
    var v1 = new Vector3([x1, y1, 0]);
    // read v2:
    var x2 = parseFloat(document.getElementById('xcord2').value);
    var y2 = parseFloat(document.getElementById('ycord2').value);
    var v2 = new Vector3([x2, y2, 0]);

    drawVector(v1, "red");
    drawVector(v2, "blue");
    
    // read operation and scalar:
    var op = document.getElementById('operation').value;
    var scalar = parseFloat(document.getElementById('scalar').value);

    // perform operation:
    if (op == "add") {
        var v3 = new Vector3([x1, y1, 0]);
        v3.add(v2);
        drawVector(v3, 'green');
    }
    else if (op == "sub") {
        var v3 = new Vector3([x1, y1, 0]);
        v3.sub(v2);
        drawVector(v3, 'green');
    }
    else if (op == "div") {
        var v3 = new Vector3([x1, y1, 0]);
        var v4 = new Vector3([x2, y2, 0]);
        v3.div(scalar);
        v4.div(scalar);
        drawVector(v3, 'green');
        drawVector(v4, 'green');
    }
    else if (op == "mul") {
        var v3 = new Vector3([x1, y1, 0]);
        var v4 = new Vector3([x2, y2, 0]);
        v3.mul(scalar);
        v4.mul(scalar);
        drawVector(v3, 'green');
        drawVector(v4, 'green');
    }
    else if (op == "mag") {
        console.log("Magnitude v1: ", v1.magnitude());
        console.log("Magnitude v2: ", v2.magnitude());
    }
    else if (op == "norm") {
        var v3 = new Vector3([x1, y1, 0]);
        var v4 = new Vector3([x2, y2, 0]);
        v3.normalize();
        v4.normalize();
        drawVector(v3, 'green');
        drawVector(v4, 'green');
    }
    else if (op == "angle") {
        console.log("Angle: ", angleBetween(v1, v2));
    }
    else if (op == "area") {
        console.log("Area of the triangle: ", areaTriangle(v1, v2));
    }
}

// QUESTION 7
function angleBetween(v1, v2) {
    // dot(v1, v2) = ||v1|| * ||v2|| * cos(angle)
    var dotProduct = Vector3.dot(v1, v2);
    var magnitudes = v1.magnitude() * v2.magnitude();
    var angle = Math.acos(dotProduct / magnitudes);

    // convert radians into degrees
    return angle * (180 / Math.PI);
}

// QUESTION 8
function areaTriangle(v1, v2) {
    var crossProduct = Vector3.cross(v1, v2);
    var magnitudes = crossProduct.magnitude()
    var area = 0.5 * magnitudes;

    return area;
}