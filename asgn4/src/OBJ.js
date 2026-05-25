class OBJModel {
    constructor() {
        this.vertices = [];
        this.normals = [];
        this.matrix = new Matrix4();
        this.normalMatrix = new Matrix4();
        this.color = [1,1,1,1];
        this.textureNum = -2;
    }

    loadOBJ(text) {
        let lines = text.split('\n');

        let tempVerts = [];
        let tempNormals = [];

        for (let line of lines) {
            line = line.trim();

            let parts = line.split(/\s+/);

            if (parts[0] == 'v') {
                tempVerts.push([
                    parseFloat(parts[1]),
                    parseFloat(parts[2]),
                    parseFloat(parts[3])
                ]);
            }

            else if (parts[0] == 'vn') {
                tempNormals.push([
                    parseFloat(parts[1]),
                    parseFloat(parts[2]),
                    parseFloat(parts[3])
                ]);
            }

            else if (parts[0] == 'f') {
                let faceVerts = parts.slice(1);

                for (let i = 1; i < faceVerts.length - 1; i++) {
                    let tri = [faceVerts[0], faceVerts[i], faceVerts[i + 1]];

                    let p0 = tempVerts[parseInt(tri[0].split('/')[0]) - 1];
                    let p1 = tempVerts[parseInt(tri[1].split('/')[0]) - 1];
                    let p2 = tempVerts[parseInt(tri[2].split('/')[0]) - 1];

                    let ux = p1[0] - p0[0];
                    let uy = p1[1] - p0[1];
                    let uz = p1[2] - p0[2];

                    let vx = p2[0] - p0[0];
                    let vy = p2[1] - p0[1];
                    let vz = p2[2] - p0[2];

                    let nx = uy * vz - uz * vy;
                    let ny = uz * vx - ux * vz;
                    let nz = ux * vy - uy * vx;

                    let len = Math.sqrt(nx*nx + ny*ny + nz*nz);
                    if (len > 0) {
                        nx /= len;
                        ny /= len;
                        nz /= len;
                    } else {
                        nx = 0; ny = 1; nz = 0;
                    }

                    for (let j = 0; j < 3; j++) {
                        let vIndex = parseInt(tri[j].split('/')[0]) - 1;

                        this.vertices.push(...tempVerts[vIndex]);
                        this.normals.push(nx, ny, nz);
                    }
                }
            }
        }
    }

    render() {

        gl.uniform1i(u_whichTexture, this.textureNum);

        gl.uniform4f(
            u_FragColor,
            this.color[0],
            this.color[1],
            this.color[2],
            this.color[3]
        );

        gl.uniformMatrix4fv(
            u_ModelMatrix,
            false,
            this.matrix.elements
        );

        this.normalMatrix.setInverseOf(this.matrix);
        this.normalMatrix.transpose();

        gl.uniformMatrix4fv(
            u_NormalMatrix,
            false,
            this.normalMatrix.elements
        );

        drawTriangle3DUVNormal(this.vertices, this.normals);
    }
}