class Cube {
    constructor() {
        this.type = 'cube';
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.matrix = new Matrix4();
        this.textureNum = -2;
    }

    render() {
        var rgba = this.color;

        // pass the texture number
        gl.uniform1i(u_whichTexture, this.textureNum);

        // pass the matrix to u_ModeMatrix attribute
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

        // pass the matrix to u_ModelMatrix attribute
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        // front
        drawTriangle3DUV([0,0,0, 1,1,0, 1,0,0], [0,0, 1,1, 1,0]);
        drawTriangle3DUV([0,0,0, 0,1,0, 1,1,0], [0,0, 0,1, 1,1]);

        // pass the color of a point to u_FragColor uniform variable
        gl.uniform4f(u_FragColor, rgba[0]*0.9, rgba[1]*0.9, rgba[2]*0.9, rgba[3]);

        // top
        drawTriangle3DUV([0,1,0, 0,1,1, 1,1,1], [0,1, 0,0, 1,0]);
        drawTriangle3DUV([0,1,0, 1,1,1, 1,1,0], [0,1, 1,0, 1,1]);

        // bottom
        drawTriangle3DUV([0,0,0, 1,0,1, 0,0,1], [0,0, 1,1, 0,1]);
        drawTriangle3DUV([0,0,0, 1,0,0, 1,0,1], [0,0, 1,0, 1,1]);

        // left
        drawTriangle3DUV([0,0,0, 0,1,1, 0,0,1], [0,0, 1,1, 1,0]);
        drawTriangle3DUV([0,0,0, 0,1,0, 0,1,1], [0,0, 0,1, 1,1]);

        // right
        drawTriangle3DUV([1,0,0, 1,0,1, 1,1,1], [0,0, 1,0, 1,1]);
        drawTriangle3DUV([1,0,0, 1,1,1, 1,1,0], [0,0, 1,1, 0,1]);

        // back
        drawTriangle3DUV([0,0,1, 1,0,1, 1,1,1], [0,0, 1,0, 1,1]);
        drawTriangle3DUV([0,0,1, 1,1,1, 0,1,1], [0,0, 1,1, 0,1]);
    }

    renderfast() {
        var rgba = this.color;

        gl.uniform1i(u_whichTexture, this.textureNum);

        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

         // pass the color of a point to u_FragColor uniform variable
        gl.uniform4f(u_FragColor, rgba[0]*0.9, rgba[1]*0.9, rgba[2]*0.9, rgba[3]);

        var allverts = [];
        var alluvs = [];

        // front
        allverts = allverts.concat([0,0,0, 1,1,0, 1,0,0]);
        alluvs   = alluvs.concat(  [0,0,   1,1,   1,0  ]);
        allverts = allverts.concat([0,0,0, 0,1,0, 1,1,0]);
        alluvs   = alluvs.concat(  [0,0,   0,1,   1,1  ]);

        // top
        allverts = allverts.concat([0,1,0, 0,1,1, 1,1,1]);
        alluvs   = alluvs.concat(  [0,1,   0,0,   1,0  ]);
        allverts = allverts.concat([0,1,0, 1,1,1, 1,1,0]);
        alluvs   = alluvs.concat(  [0,1,   1,0,   1,1  ]);

        // bottom
        allverts = allverts.concat([0,0,0, 1,0,1, 0,0,1]);
        alluvs   = alluvs.concat(  [0,0,   1,1,   0,1  ]);
        allverts = allverts.concat([0,0,0, 1,0,0, 1,0,1]);
        alluvs   = alluvs.concat(  [0,0,   1,0,   1,1  ]);

        // left
        allverts = allverts.concat([0,0,0, 0,1,1, 0,0,1]);
        alluvs   = alluvs.concat(  [0,0,   1,1,   1,0  ]);
        allverts = allverts.concat([0,0,0, 0,1,0, 0,1,1]);
        alluvs   = alluvs.concat(  [0,0,   0,1,   1,1  ]);

        // right
        allverts = allverts.concat([1,0,0, 1,0,1, 1,1,1]);
        alluvs   = alluvs.concat(  [0,0,   1,0,   1,1  ]);
        allverts = allverts.concat([1,0,0, 1,1,1, 1,1,0]);
        alluvs   = alluvs.concat(  [0,0,   1,1,   0,1  ]);

        // back
        allverts = allverts.concat([0,0,1, 1,0,1, 1,1,1]);
        alluvs   = alluvs.concat(  [0,0,   1,0,   1,1  ]);
        allverts = allverts.concat([0,0,1, 1,1,1, 0,1,1]);
        alluvs   = alluvs.concat(  [0,0,   1,1,   0,1  ]);

        drawTriangle3DUV(allverts, alluvs);
    }
}
