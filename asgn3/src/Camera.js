class Vector {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    add(v)      { return new Vector(this.x+v.x, this.y+v.y, this.z+v.z); }
    subtract(v) { return new Vector(this.x-v.x, this.y-v.y, this.z-v.z); }
    multiply(s) { return new Vector(this.x*s, this.y*s, this.z*s); }
    divide(s)   { return new Vector(this.x/s, this.y/s, this.z/s); }
    length()    { return Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z); }
    normalize() { return this.divide(this.length()); }
    cross(v)    { return new Vector(
        this.y*v.z - this.z*v.y,
        this.z*v.x - this.x*v.z,
        this.x*v.y - this.y*v.x
    ); }
}

class Camera {
    constructor() {
        this.eye = new Vector(0,0.75,3);
        this.at = new Vector(0,0,-100);
        this.up = new Vector(0,1,0);
    }

    forward() {
        var f = this.at.subtract(this.eye);
        f.y = 0;
        f = f.divide(f.length()).multiply(0.1);
        this.at = this.at.add(f);
        this.eye = this.eye.add(f);
    }

    back() {
        var f = this.eye.subtract(this.at);
        f.y = 0;
        f = f.divide(f.length()).multiply(0.1);
        this.at = this.at.add(f);
        this.eye = this.eye.add(f);
    }

    left() {
        var f = this.eye.subtract(this.at);
        f.y = 0;
        f = f.divide(f.length());
        var s = f.cross(this.up);
        s = s.divide(s.length()).multiply(0.1);
        this.at = this.at.add(s);
        this.eye = this.eye.add(s);
    }

    right() {
        var f = this.at.subtract(this.eye);
        f.y = 0;
        f = f.divide(f.length());
        var s = f.cross(this.up);
        s = s.divide(s.length()).multiply(0.1);
        this.at = this.at.add(s);
        this.eye = this.eye.add(s);
    }

    panLeft() {
        var f = this.at.subtract(this.eye);
        var angle = 5 * Math.PI / 180;
        var newF = new Vector(
            f.x * Math.cos(angle) + f.z * Math.sin(angle),
            f.y,
            -f.x * Math.sin(angle) + f.z * Math.cos(angle)
        );
        this.at = this.eye.add(newF);
    }

    panRight() {
        var f = this.at.subtract(this.eye);
        var angle = -5 * Math.PI / 180;
        var newF = new Vector(
            f.x * Math.cos(angle) + f.z * Math.sin(angle),
            f.y,
            -f.x * Math.sin(angle) + f.z * Math.cos(angle)
        );
        this.at = this.eye.add(newF);
    }

    panUp(angle) {
        var f = this.at.subtract(this.eye).normalize();
        var s = f.cross(this.up).normalize(); // side/right axis
        
        var cos = Math.cos(angle);
        var sin = Math.sin(angle);
        
        // Rodrigues rotation of f around s axis
        var newF = new Vector(
            f.x * cos + (s.y * f.z - s.z * f.y) * sin,
            f.y * cos + (s.z * f.x - s.x * f.z) * sin,
            f.z * cos + (s.x * f.y - s.y * f.x) * sin
        ).normalize();
        
        this.at = this.eye.add(newF);
    }
}