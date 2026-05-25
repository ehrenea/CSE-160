class Cone {
    constructor() {
        this.type = 'cone';
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.matrix = new Matrix4();
        this.segments = 12;
        this.textureNum = -2;
    }

    render() {
        var rgba = this.color;

        gl.uniform1i(u_whichTexture, this.textureNum);
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
        gl.uniform4f(u_FragColor, rgba[0]*0.9, rgba[1]*0.9, rgba[2]*0.9, rgba[3]);

        var segs = this.segments;
        var angleStep = 360 / segs;

        for (var angle = 0; angle < 360; angle += angleStep) {
            var angle1 = angle * Math.PI / 180;
            var angle2 = (angle + angleStep) * Math.PI / 180;

            var x1 = Math.cos(angle1) * 0.5;
            var z1 = Math.sin(angle1) * 0.5;
            var x2 = Math.cos(angle2) * 0.5;
            var z2 = Math.sin(angle2) * 0.5;

            drawTriangle3DUV( [0,1,0, x1,0,z1, x2,0,z2], [0.5,1, 0,0, 1,0] );
            drawTriangle3DUV( [0,0,0,   x2,0,z2,   x1,0,z1], [0.5,0.5, 1,1, 0,1]);
        }
    }
}