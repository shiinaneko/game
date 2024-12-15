class GameManager {
    constructor() {
        this.engine = Matter.Engine.create();
        this.world = this.engine.world;
        
        // キャンバスの設定
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 800;
        this.canvas.height = 600;

        // オブジェクトの配列
        this.rings = [];
        this.pins = [];

        // 重力設定
        this.engine.world.gravity.y = 0.3;
        this.friction = 0.995;
        this.restitution = 0.95;

        this.selectedPin = null;

        this.setupEventListeners();
        this.init();
    }

    init() {
        // リングとピンの初期配置
        this.ring_radius = 40;
        this.pin_radius = 8;
        this.pin_margin = 4;
        this.pin_visual_radius = this.pin_radius + this.pin_margin;
        
        for (let i = 0; i < 8; i++) {
            this.createRing();
        }
        for (let i = 0; i < 5; i++) {
            this.createPin();
        }
    }

    createRing() {
        const x = Math.random() * (this.canvas.width - this.ring_radius * 2) + this.ring_radius;
        const y = Math.random() * (this.canvas.height / 2 - this.ring_radius * 2) + this.ring_radius;
        const ring = new Ring(x, y, this.ring_radius, {
            restitution: this.restitution,
            friction: this.friction,
            color: this.getRandomColor()
        });
        ring.velocity = {x: (Math.random() * 4 - 2), y: 0};
        this.rings.push(ring);
        Matter.World.add(this.world, ring.body);
    }

    createPin() {
        const x = Math.random() * (this.canvas.width - this.pin_radius * 2) + this.pin_radius;
        const y = Math.random() * (this.canvas.height - this.pin_radius * 2) + this.pin_radius;
        const pin = new Pin(x, y, this.pin_radius);
        this.pins.push(pin);
        Matter.World.add(this.world, pin.body);
    }
    
    getRandomColor() {
        const r = Math.floor(Math.random() * 256);
        const g = Math.floor(Math.random() * 256);
        const b = Math.floor(Math.random() * 256);
        return `rgb(${r}, ${g}, ${b})`;
    }

    update() {
        Matter.Engine.update(this.engine);
        this.updateRingPhysics();
        this.draw();
        requestAnimationFrame(() => this.update());
    }

    updateRingPhysics() {
        this.rings.forEach(ring => {
            // 重力適用
            ring.body.velocity.y += this.engine.world.gravity.y;

            // 摩擦
            ring.body.velocity.x *= this.friction;
            ring.body.velocity.y *= this.friction;

            // 壁との衝突
            if (ring.body.position.x < this.ring_radius) {
                ring.body.position.x = this.ring_radius;
                ring.body.velocity.x *= -this.restitution;
            } else if (ring.body.position.x > this.canvas.width - this.ring_radius) {
                ring.body.position.x = this.canvas.width - this.ring_radius;
                ring.body.velocity.x *= -this.restitution;
            }

            if (ring.body.position.y < this.ring_radius) {
                ring.body.position.y = this.ring_radius;
                ring.body.velocity.y *= -this.restitution;
            } else if (ring.body.position.y > this.canvas.height - this.ring_radius) {
                ring.body.position.y = this.canvas.height - this.ring_radius;
                ring.body.velocity.y *= -this.restitution;
            }
            
            // ピンとの衝突判定
            this.pins.forEach(pin => {
                const dist = this.distance(ring.body.position, pin.body.position);
                if (dist - this.ring_radius < this.pin_radius && dist > this.ring_radius - this.pin_radius) {
                    const dx = ring.body.position.x - pin.body.position.x;
                    const dy = ring.body.position.y - pin.body.position.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    if (dist !== 0) {
                        const nx = dx / dist;
                        const ny = dy / dist;
                        
                        const idealDist = this.ring_radius;
                        ring.body.position.x = pin.body.position.x + nx * idealDist;
                        ring.body.position.y = pin.body.position.y + ny * idealDist;
                        
                        const dotProduct = ring.body.velocity.x * nx + ring.body.velocity.y * ny;
                        ring.body.velocity.x = (ring.body.velocity.x - 2 * dotProduct * nx) * this.restitution;
                        ring.body.velocity.y = (ring.body.velocity.y - 2 * dotProduct * ny) * this.restitution;
                    }
                }
            });
        });
        
        // リング同士の衝突判定
        for (let i = 0; i < this.rings.length; i++) {
            for (let j = i + 1; j < this.rings.length; j++) {
                this.handleRingCollision(this.rings[i], this.rings[j]);
            }
        }
    }
    
    handleRingCollision(ring1, ring2) {
        const dx = ring1.body.position.x - ring2.body.position.x;
        const dy = ring1.body.position.y - ring2.body.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < this.ring_radius * 2) {
            const nx = dx / dist;
            const ny = dy / dist;
            
            const overlap = (this.ring_radius * 2 - dist) / 2;
            ring1.body.position.x += nx * overlap;
            ring1.body.position.y += ny * overlap;
            ring2.body.position.x -= nx * overlap;
            ring2.body.position.y -= ny * overlap;
            
            const v1x = ring1.body.velocity.x;
            const v1y = ring1.body.velocity.y;
            const v2x = ring2.body.velocity.x;
            const v2y = ring2.body.velocity.y;
            
            const dotProduct = (v1x - v2x) * nx + (v1y - v2y) * ny;
            
            ring1.body.velocity.x = (v1x - dotProduct * nx) * this.restitution;
            ring1.body.velocity.y = (v1y - dotProduct * ny) * this.restitution;
            ring2.body.velocity.x = (v2x + dotProduct * nx) * this.restitution;
            ring2.body.velocity.y = (v2y + dotProduct * ny) * this.restitution;
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.rings.forEach(ring => ring.draw(this.ctx));
        this.pins.forEach(pin => this.drawPinWithMargin(pin));
    }
    
    drawPinWithMargin(pin) {
        const pos = pin.body.position;
        const margin_color = pin.isMovable ? 'rgba(255, 200, 200, 0.5)' : 'rgba(200, 200, 255, 0.5)';
        this.ctx.beginPath();
        this.ctx.fillStyle = margin_color;
        this.ctx.arc(pos.x, pos.y, this.pin_visual_radius, 0, Math.PI * 2);
        this.ctx.fill();
        pin.draw(this.ctx);
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            // ピンのクリック判定と移動処理
            if (this.selectedPin) {
                Matter.Body.setPosition(this.selectedPin.body, {x: mouseX, y: mouseY});
                this.selectedPin.toggleMovable();
                this.selectedPin = null;
                return;
            }

            this.pins.forEach(pin => {
                const dist = this.distance({x: mouseX, y: mouseY}, pin.body.position);
                 if (dist < this.pin_visual_radius) {
                    pin.toggleMovable();
                    this.selectedPin = pin;
                    return;
                }
            });
        });
    }
    
    distance(p1, p2) {
        return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
    }
}
