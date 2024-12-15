class Ring {
    constructor(x, y, radius, options = {}) {
        this.body = Matter.Bodies.circle(x, y, radius, {
            isStatic: false,
            restitution: 0.95,
            friction: 0.1,
            ...options
        });
        
        this.radius = radius;
        this.color = options.color || '#ff0000';
    }

    draw(ctx) {
        const pos = this.body.position;
        ctx.beginPath();
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 4;
        ctx.arc(pos.x, pos.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
    }
}
