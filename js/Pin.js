class Pin {
    constructor(x, y, radius) {
        this.body = Matter.Bodies.circle(x, y, radius, {
            isStatic: true
        });
        
        this.radius = radius;
        this.color = '#0000ff';
        this.isMovable = false;
    }

    draw(ctx) {
        const pos = this.body.position;
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.arc(pos.x, pos.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    toggleMovable() {
        this.isMovable = !this.isMovable;
        this.color = this.isMovable ? '#ff0000' : '#0000ff';
    }
}
