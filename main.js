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

canvas.addEventListener('mousedown', e => {
    mouse.isDown = true;
});



canvas.addEventListener('mouseup', e => {
    mouse.isDown = false;
});


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

        // zufällige Anfangsgeschwindigkeit
        const speed = Math.random() * 0.5 + 0.2;
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

        const steps = [0, 0.55, 0.65, 0.7, 0.75, 0.8, 0.9, 0.95, 1];
        const gradient = ctx.createRadialGradient(x, y, this.radius * 0.2, x, y, this.radius);
        steps.forEach((step) =>
            gradient.addColorStop(step, `rgba(${this.color[0]},${this.color[1]},${this.color[2]},${calcBubbleOpacity(step)})`)
        );

        ctx.beginPath();
        ctx.fillStyle = gradient;
        ctx.arc(x, y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.save();

        // Highlight
        const angleRadians = 235 * Math.PI / 180;
        const pos = pointOnCircle(x, y, this.radius * 0.8, angleRadians);

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

    update(ctx) {
        this.localWind.update();
        this.handleMouseForce();
        this.draw(ctx);
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

const bubbles = [];
const bubbleCount = 45;
for (let i = 0; i < bubbleCount; i++) {
    bubbles.push(new Bubble());
}

const globalWind = new Wind(0.000001, 0.000001, 2000, 1000, 2000, 4000, bubbles);


function animate() {
    Engine.update(engine);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    handleMouseCircle();
    for (let b of bubbles) {
        b.update();
        globalWind.update();
    }
    requestAnimationFrame(animate);
}

animate();

























