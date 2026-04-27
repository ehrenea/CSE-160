class Cone {
    constructor() {
        this.type = 'cone';
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.matrix = new Matrix4();
        this.segments = 12;
    }

    render() {
        var rgba = this.color;

        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        var segs = this.segments;
        var angleStep = 360 / segs;

        for (var angle = 0; angle < 360; angle += angleStep) {
            var angle1 = angle * Math.PI / 180;
            var angle2 = (angle + angleStep) * Math.PI / 180;

            var x1 = Math.cos(angle1) * 0.5;
            var z1 = Math.sin(angle1) * 0.5;
            var x2 = Math.cos(angle2) * 0.5;
            var z2 = Math.sin(angle2) * 0.5;

            drawTriangle3D([0,1,0,      x1,0,z1,    x2,0,z2]);

            gl.uniform4f(u_FragColor, rgba[0]*0.8, rgba[1]*0.8, rgba[2]*0.8, rgba[3]);
            drawTriangle3D([0,0,0,      x2,0,z2,    x1,0,z1]);
            gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        }
    }
}