const canvas = document.getElementById("bubbleCanvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

/* Matter.js setup */
const Engine = Matter.Engine,
    World = Matter.World,
    Bodies = Matter.Bodies,
    Body = Matter.Body;

const engine = Engine.create();
const world = engine.world;
engine.gravity.y = 0;



/* WALLS */
const wallThickness = 100; // Dicke der Wände außerhalb des Bildschirms

const walls = [
    // Oben
    Matter.Bodies.rectangle(canvas.width / 2, -wallThickness / 2, canvas.width, wallThickness, { isStatic: true }),
    // Unten
    Matter.Bodies.rectangle(canvas.width / 2, canvas.height + wallThickness / 2, canvas.width, wallThickness, { isStatic: true }),
    // Links
    Matter.Bodies.rectangle(-wallThickness / 2, canvas.height / 2, wallThickness, canvas.height, { isStatic: true }),
    // Rechts
    Matter.Bodies.rectangle(canvas.width + wallThickness / 2, canvas.height / 2, wallThickness, canvas.height, { isStatic: true }),
];

Matter.World.add(engine.world, walls);


/* MOUSE */
const mouse = { x: canvas.width / 2, y: canvas.height / 2, isDown: false };


canvas.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

let rightClickStart = null;
canvas.addEventListener("mousedown", (e) => {
    console.log(e.button);
    if (e.button === 0) {
        mouse.isDown = true;
    }
    if (e.button === 2) {
        rightClickStart = Date.now();
    }
});
canvas.addEventListener("mouseup", (e) => {
    mouse.isDown = false;
    if (e.button === 2 && rightClickStart) {
        const heldTime = Date.now() - rightClickStart;
        if (heldTime > 500) {
            towers.push(new OrangUtanTower(mouse.x, mouse.y));
        } else {
            towers.push(new MonkeyTower(mouse.x, mouse.y));
        }
        rightClickStart = null;
    }
});
canvas.addEventListener("contextmenu", (e) => e.preventDefault());

function calcBubbleOpacity(x) {
    var y = -((1-x)/(0.05));
    var val = Math.pow(2, y);
    val *= 0.8;
    return val;
}

function pointOnCircle(cx, cy, radius, angleRadians) {
    const x = cx + radius * Math.cos(angleRadians);
    const y = cy + radius * Math.sin(angleRadians);
    return { x, y };
}
class Wind {
    constructor(forceMin, forceExtension, waitTimeMin, waitTimeExtension, durationMin, durationExtension, objects) {
        this.forceMin = forceMin;
        this.forceExtension = forceExtension;
        this.waitTimeMin = waitTimeMin;
        this.waitTimeExtension = waitTimeExtension;
        this.durationMin = durationMin;
        this.durationExtension = durationExtension;
        this.objects = objects;

        this.active = false;
        this.direction = { x: 0, y: 0 };
        this.nextStartTime = Date.now() + this.calcWindWaitTime()
        this.nextEndTime = 0;
    }

    update() {
        if (!this.active && Date.now() > this.nextStartTime) {
            this.activateWind();
        }
        if (this.active && Date.now() > this.nextEndTime) {
            this.deactivateWind();
        }
        if (this.active) {
            this.objects.forEach((object) => {
                Matter.Body.applyForce(object.body, object.body.position, this.direction);
            })
        }

    }

    calcWindWaitTime() {
        return this.waitTimeMin + Math.random() * this.waitTimeExtension;
    }
    calcWindWaitDuration() {
        return this.durationMin + Math.random() * this.durationExtension;
    }

    activateWind() {
        const angle = Math.random() * Math.PI * 2;
        const force = this.forceMin + Math.random() * this.forceExtension;
        this.direction = {
            x: Math.cos(angle) * force,
            y: Math.sin(angle) * force
        };
        this.active = true;
        this.nextEndTime = Date.now() + this.calcWindWaitDuration();
        this.nextStartTime = this.nextEndTime + this.calcWindWaitTime();
    }
    deactivateWind() {
        this.active = false;
    }
}

class Bubble {
    constructor() {
        this.radius = 80;
        this.color = [
            Math.floor(Math.random() * 100 + 155),
            Math.floor(Math.random() * 100 + 155),
            Math.floor(Math.random() * 100 + 155)
        ];

        const x = Math.random() * (canvas.width - 2 * this.radius) + this.radius;
        const y = Math.random() * (canvas.height - 2 * this.radius) + this.radius;

        this.body = Bodies.circle(x, y, this.radius, {
            restitution: 0.9,
            frictionAir: 0.0,
            collisionFilter: { group: 0 },
        });
        this.rotation = 0;
        this.spinVelocity = 0;

        // zufällige Anfangsgeschwindigkeit
        const speed = Math.random() * 0.2 + 0.2;
        const angle = Math.random() * Math.PI * 2;
        Body.setVelocity(this.body, {
            x: Math.cos(angle) * speed * 10,
            y: Math.sin(angle) * speed * 10
        });

        this.localWind = new Wind(0.000001, 0.001, 1000, 10000, 1000, 5000, [this]);

        World.add(world, this.body);
    }



    draw() {
        const x = this.body.position.x;
        const y = this.body.position.y;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(this.rotation); // Only rotates visually if spinVelocity ≠ 0

        const steps = [0, 0.55, 0.65, 0.7, 0.75, 0.8, 0.9, 0.95, 1];
        const gradient = ctx.createRadialGradient(0, 0, this.radius * 0.2, 0, 0, this.radius);
        steps.forEach((step) =>
            gradient.addColorStop(step, `rgba(${this.color[0]},${this.color[1]},${this.color[2]},${calcBubbleOpacity(step)})`)
        );

        ctx.beginPath();
        ctx.fillStyle = gradient;
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Highlight
        const angleRadians = 235 * Math.PI / 180;
        const pos = pointOnCircle(0, 0, this.radius * 0.8, angleRadians);
        ctx.beginPath();
        ctx.ellipse(pos.x, pos.y, 16, 6.5, angleRadians + Math.PI / 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fill();

        ctx.restore();
    }


    handleMouseForce() {
        const MOUSE_INFLUENCE_RADIUS_PULL = 1000;
        const MOUSE_FORCE_FACTOR_PULL = 0.1;
        const MOUSE_INFLUENCE_RADIUS_PUSH = 150;
        const MOUSE_FORCE_FACTOR_PUSH = 0.01;

        const dx = this.body.position.x - mouse.x;
        const dy = this.body.position.y - mouse.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        const applyForce = distance > 1 && (!mouse.isDown && distance < MOUSE_INFLUENCE_RADIUS_PUSH) ||
            (mouse.isDown && distance < MOUSE_INFLUENCE_RADIUS_PULL);
        if (applyForce) {
            const direction = mouse.isDown ? -1 : 1;
            const force = mouse.isDown ? MOUSE_FORCE_FACTOR_PULL : MOUSE_FORCE_FACTOR_PUSH;
            var forceMagnitude = 0;
            if (mouse.isDown) {
                forceMagnitude = force / (Math.max(80,distance) - 50) * direction;
            } else {
                forceMagnitude = force * ((MOUSE_INFLUENCE_RADIUS_PULL - Math.max(80,distance)) / MOUSE_INFLUENCE_RADIUS_PULL) * direction;
            }
            const fx = (dx / distance) * forceMagnitude;
            const fy = (dy / distance) * forceMagnitude;
            Matter.Body.applyForce(this.body, this.body.position, { x: fx, y: fy });
        }
    }

    handleSpin() {
        this.rotation += this.spinVelocity;
        // Friction: gradually reduce spin
        this.spinVelocity *= 0.98; // Lower means faster stop
        // If it's small enough, stop completely
        if (Math.abs(this.spinVelocity) < 0.001) {
            this.spinVelocity = 0;
        }
    }

    update(ctx) {
        this.localWind.update();
        this.handleMouseForce();
        this.handleSpin()
        this.draw(ctx);
    }
}


class MonkeyTower {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.arrows = [];
        this.shootInterval = 1500 + Math.random() * 2000; // alle 1.5-3.5 Sekunden schießen
        this.lastShotTime = Date.now();
    }

    update() {
        // Pfeile schießen
        if (Date.now() - this.lastShotTime > this.shootInterval) {
            this.shootArrow();
            this.lastShotTime = Date.now();
            this.shootInterval = 1500 + Math.random() * 2000;
        }

        // Update Pfeile
        this.arrows.forEach((arrow, i) => {
            arrow.update();
            if (arrow.isOutOfBounds() || arrow.toRemove) {
                this.arrows.splice(i, 1);
            }
        });

        // zeichnen
        this.draw();
    }

    shootArrow() {
        const angle = Math.random() * Math.PI * 2;
        const speed = 7 + Math.random() * 3;
        this.arrows.push(new Arrow(this.x, this.y, angle, speed));
    }

    draw() {
        // Affen-Emoji zeichnen
        ctx.font = "40px serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("🐒", this.x, this.y);

        // Pfeile zeichnen
        this.arrows.forEach(arrow => arrow.draw(ctx));
    }
}

class OrangUtanTower {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.lastShot = 0;
        this.shootInterval = 1500; // alle 1.5 Sekunden
    }

    update() {
        // Emoji zeichnen
        ctx.font = "32px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("🦧", this.x, this.y);

        // Bananen werfen
        const now = Date.now();
        if (now - this.lastShot > this.shootInterval) {
            bananas.push(new Banana(this.x, this.y));
            this.lastShot = now;
        }
    }
}

class Banana {
    constructor(x, y) {
        const radius = 14;
        const angle = Math.random() * Math.PI * 2;
        const speed = 4 + Math.random() * 16;
        this.body = Bodies.circle(x, y, radius, {
            frictionAir: 0.05,     // Verlangsamt sich
            restitution: 0.8,      // Prallt ab
            label: "banana"
        });
        Body.setVelocity(this.body, {
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed
        });
        World.add(world, this.body);
    }

    draw() {
        const x = this.body.position.x;
        const y = this.body.position.y;
        ctx.font = "20px serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("🍌", x, y);
    }
}

class Arrow {
    constructor(x, y, angle, speed) {
        this.x = x;
        this.y = y;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.radius = 15; // für Kollisionsabfrage (ungefähr)
        this.toRemove = false;
        this.size = 25;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        // Kollision mit Bubbles prüfen
        for (let i = 0; i < bubbles.length; i++) {
            const b = bubbles[i];
            const dx = b.body.position.x - this.x;
            const dy = b.body.position.y - this.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < b.radius + this.radius) {
                // Bubble zerstören
                World.remove(world, b.body);
                bubbles.splice(i, 1);
                this.toRemove = true;
                break;
            }
        }
    }

    draw(ctx) {
        const angle = Math.atan2(this.vy, this.vx);

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(angle);
        ctx.font = `${this.size}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("🪃", 0, 0);
        ctx.restore();
    }

    isOutOfBounds() {
        return this.x < -50 || this.x > canvas.width + 50 || this.y < -50 || this.y > canvas.height + 50;
    }
}










function handleMouseCircle() {
    if (mouse.isDown) {
        console.log("drawCircle", mouse.x, mouse.y);
        const radius = 20;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.fill();
    }

}

function handleBananaCollision() {
    for (let bananaIndex = 0; bananaIndex < bananas.length; bananaIndex++) {
        const banana = bananas[bananaIndex];
        banana.draw();

        for (let i = 0; i < bubbles.length; i++) {
            const bubble = bubbles[i];
            const dx = banana.body.position.x - bubble.body.position.x;
            const dy = banana.body.position.y - bubble.body.position.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < bubble.radius + 14) {
                // Remove banana
                World.remove(world, banana.body);
                bananas.splice(bananaIndex, 1);
                banana.toRemove = true;

                // Apply push force
                const angle = Math.random() * Math.PI * 2;
                const force = 0.02 + Math.random() * 0.02;
                const fx = Math.cos(angle) * force;
                const fy = Math.sin(angle) * force;
                //Body.applyForce(bubble.body, bubble.body.position, { x: fx, y: fy });

                // 🌀 Add random spin
                const spin = (Math.random() * 0.15 + 0.05) * (Math.random() < 0.5 ? -1 : 1);
                bubble.spinVelocity = spin
                Body.setAngularVelocity(bubble.body, spin);
            }
        }
    }
}



const bubbles = [];
const bubbleCount = 20;
for (let i = 0; i < bubbleCount; i++) {
    bubbles.push(new Bubble());
}
 /* TOWERS */
const towers = [];
const bananas = [];


const globalWind = new Wind(0.000001, 0.000001, 2000, 1000, 2000, 4000, bubbles);


function animate() {
    Engine.update(engine);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    handleMouseCircle();
    handleBananaCollision();

    for (let b of bubbles) {
        b.update();
        globalWind.update();
    }

    // Affen updaten & zeichnen
    towers.forEach(t => t.update());

    requestAnimationFrame(animate);
}

animate();

























