


const canvas = document.getElementById("bubbleCanvas");
const ctx = canvas.getContext("2d");



const MAX_TOWERS = 30;


/* WIND */
const GLOBAL_WIND_FORCEMIN =  0.000001;
const GLOBAL_WIND_FORCEEXTENSION =  0.000001;
const GLOBAL_WIND_WAITTIMEMIN =  2000;
const GLOBAL_WIND_WAITTIMEEXTENSION =  1000;
const GLOBAL_WIND_DURATIONMIN =  2000;
const GLOBAL_WIND_DURATIONEXTENSION =  4000;

const LOCAL_WIND_FORCEMIN =  0.000001;
const LOCAL_WIND_FORCEEXTENSION =  0.001;
const LOCAL_WIND_WAITTIMEMIN =  1000;
const LOCAL_WIND_WAITTIMEEXTENSION =  10000;
const LOCAL_WIND_DURATIONMIN =  1000;
const LOCAL_WIND_DURATIONEXTENSION =  5000;


/* BUBBLE */
var BUBBLE_COUNT = parseInt(window.innerWidth * window.innerHeight / 140000 + 8, 10);
const BUBBLE_DEFAULT_RADIUS = parseInt(0.05 * window.innerHeight + 40, 10);
var BUBBLE_RADIUS = BUBBLE_DEFAULT_RADIUS
const BUBBLE_RESTITUTION = 0.9;
const BUBBLE_INITIAL_SPEED_MIN = 2;
const BUBBLE_INITIAL_SPEED_EXTENSION = 2;
const BUBBLE_SPAWN_FACTOR = 4;


/* MOUSE */
const MOUSE_INFLUENCE_RADIUS_PULL = 1000;
const MOUSE_FORCE_FACTOR_PULL = 0.1;
const MOUSE_INFLUENCE_RADIUS_PUSH = 150;
const MOUSE_FORCE_FACTOR_PUSH = 0.01;
const MOUSE_MIN_DISTANCE = 80;
const MOUSE_EXPONENTIAL_OFFSET = 50;
const MOUSE_CIRCLE_RADIUS = 20;


/* MONKEY */
const MONKEY_SHOOTINTERVAL_MIN = 5000;
const MONKEY_SHOOTINTERVAL_EXTENSION = 5000;
const MONKEY_LIFETIME = 60000;
const MONKEY_FONTSIZE = 40;


/* ORANGUTAN */
const ORANGUTAN_SHOOTINTERVAL_MIN = 10000;
const ORANGUTAN_SHOOTINTERVAL_EXTENSION = 5000;
const ORANGUTAN_LIFETIME = 60000;
const ORANGUTAN_FONTSIZE = 40;

/* ARROW */
const ARROW_SPEED_MIN = 7;
const ARROW_SPEED_EXTENSION = 10;
const ARROW_RADIUS = 15;
const ARROW_FONTSIZE = 25;

/* BANANA */
const BANANA_SPIN_VELOCITY_FACTOR = 0.98; // Lower means faster stop
const BANANA_LIFETIME = 10000;
const BANANA_FONTSIZE = 20;
const BANANA_FORCE_MIN = 4;
const BANANA_FORCE_EXTENSION = 16;
const BANANA_FRICTIONAIR = 0.05;
const BANANA_RESTITUTION = 0.8;
const BANANA_RADIUS = 14;
const BANANA_SPIN_FORCE_MIN = 0.05;
const BANANA_SPIN_FORCE_EXTENSION = 0.15;


/* Matter.js setup */
const Engine = Matter.Engine,
    World = Matter.World,
    Bodies = Matter.Bodies,
    Body = Matter.Body;

const engine = Engine.create();
const world = engine.world;
engine.gravity.y = 0;



/* WALLS */
const wallThickness = 100;

var walls;
function calcWalls() {
    walls = [
        // Oben
        Matter.Bodies.rectangle(canvas.width / 2, -wallThickness / 2, canvas.width, wallThickness, { isStatic: true }),
        // Unten
        Matter.Bodies.rectangle(canvas.width / 2, canvas.height + wallThickness / 2, canvas.width, wallThickness, { isStatic: true }),
        // Links
        Matter.Bodies.rectangle(-wallThickness / 2, canvas.height / 2, wallThickness, canvas.height, { isStatic: true }),
        // Rechts
        Matter.Bodies.rectangle(canvas.width + wallThickness / 2, canvas.height / 2, wallThickness, canvas.height, { isStatic: true }),
    ];
}
calcWalls();

Matter.World.add(engine.world, walls);




function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    if (walls && walls.length > 0) {
        Matter.World.remove(engine.world, walls);
    }

    calcWalls();
    Matter.World.add(engine.world, walls);
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();



/* MOUSE */
const mouse = { x: canvas.width / 2, y: canvas.height / 2, isDown: false };

/* EVENTS */
canvas.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

let leftClickStart = null;
let rightClickStart = null;
canvas.addEventListener("mousedown", (e) => {
    console.log(e.button);
    if (e.button === 0) {
        leftClickStart = Date.now();
        mouse.isDown = true;
    }
    if (e.button === 2) {
        rightClickStart = Date.now();
    }
});
canvas.addEventListener("mouseup", (e) => {
    mouse.isDown = false;
    if (e.button === 0 && Date.now() - leftClickStart < 500 && checkBubbleFits(BUBBLE_RADIUS)) {
        const newBubble = new Bubble(false);
        Matter.Body.setPosition(newBubble.body, { x: mouse.x, y: mouse.y });
        bubbles.push(newBubble);
    }
    if (e.button === 2 && rightClickStart) {
        const heldTime = Date.now() - rightClickStart;
        if (heldTime > 500) {
            towers.push(new OrangUtanTower(mouse.x, mouse.y));
        } else {
            towers.push(new MonkeyTower(mouse.x, mouse.y));
        }
        if (towers.length > MAX_TOWERS) {
            towers[0].toRemove = true;
            towers.splice(0, 1);
        }
        rightClickStart = null;
    }
});
canvas.addEventListener("contextmenu", (e) => e.preventDefault());

canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    const delta = Math.sign(e.deltaY);
    BUBBLE_RADIUS -= delta * 2; // scroll up decreases deltaY => smaller
    BUBBLE_RADIUS = Math.max(BUBBLE_DEFAULT_RADIUS * 0.4, Math.min(BUBBLE_RADIUS, BUBBLE_DEFAULT_RADIUS*3));
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

function checkBubbleFits(newBubbleRadius) {
    var sum = 0;
    bubbles.forEach((bubble) => {
        sum += bubble.radius * bubble.radius * Math.PI;
    })
    sum += newBubbleRadius * newBubbleRadius * Math.PI;
    const bufferSpaceFactor = 1.3;
    console.log(sum);
    console.log(window.innerHeight * window.innerWidth);
    return sum * bufferSpaceFactor < window.innerHeight * window.innerWidth;
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
    constructor(initalVelocity) {
        this.radius = BUBBLE_RADIUS;
        this.color = [
            Math.floor(Math.random() * 100 + 155),
            Math.floor(Math.random() * 100 + 155),
            Math.floor(Math.random() * 100 + 155)
        ];

        const x = Math.random() * (canvas.width - 2 * this.radius) + this.radius;
        const y = Math.random() * (canvas.height - 2 * this.radius) + this.radius;

        this.body = Bodies.circle(x, y, this.radius, {
            restitution: BUBBLE_RESTITUTION,
            frictionAir: 0.0,
            collisionFilter: { group: 0 },
        });
        this.rotation = 0;
        this.spinVelocity = 0;

        // zufällige Anfangsgeschwindigkeit
        if (initalVelocity) {
            const speed = BUBBLE_INITIAL_SPEED_MIN + Math.random() * BUBBLE_INITIAL_SPEED_EXTENSION;
            const angle = Math.random() * Math.PI * 2;
            Body.setVelocity(this.body, {
                x: Math.cos(angle) * speed,
                y: Math.sin(angle) * speed
            });
        }
        this.localWind = new Wind(LOCAL_WIND_FORCEMIN * this.radius / BUBBLE_DEFAULT_RADIUS, LOCAL_WIND_FORCEEXTENSION  * this.radius / BUBBLE_DEFAULT_RADIUS, LOCAL_WIND_WAITTIMEMIN, LOCAL_WIND_WAITTIMEEXTENSION, LOCAL_WIND_DURATIONMIN, LOCAL_WIND_DURATIONEXTENSION, [this]);

        World.add(world, this.body);
    }



    draw() {
        const x = this.body.position.x;
        const y = this.body.position.y;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(this.rotation);

        // Gradient
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
        ctx.ellipse(pos.x, pos.y, this.radius/5, this.radius/12.3, angleRadians + Math.PI / 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fill();

        ctx.restore();
    }


    handleMouseForce() {
        const dx = this.body.position.x - mouse.x;
        const dy = this.body.position.y - mouse.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        const applyForce = distance > 1 && (!mouse.isDown && distance < MOUSE_INFLUENCE_RADIUS_PUSH) ||
            (mouse.isDown && distance < MOUSE_INFLUENCE_RADIUS_PULL);
        if (applyForce) {
            const direction = mouse.isDown ? -1 : 1;
            const force = mouse.isDown ? MOUSE_FORCE_FACTOR_PULL * (this.radius / 80) * (this.radius / 80) : MOUSE_FORCE_FACTOR_PUSH * (this.radius / 80) *  (this.radius / 80);
            var forceMagnitude = 0;
            if (mouse.isDown) {
                forceMagnitude = force / (Math.max(MOUSE_MIN_DISTANCE,distance) - MOUSE_EXPONENTIAL_OFFSET) * direction;
            } else {
                forceMagnitude = force * ((MOUSE_INFLUENCE_RADIUS_PULL - Math.max(MOUSE_MIN_DISTANCE,distance)) / MOUSE_INFLUENCE_RADIUS_PULL) * direction;
            }
            const fx = (dx / distance) * forceMagnitude;
            const fy = (dy / distance) * forceMagnitude;
            Matter.Body.applyForce(this.body, this.body.position, { x: fx, y: fy });
        }
    }

    handleSpin() {
        this.rotation += this.spinVelocity;
        // Friction: gradually reduce spin
        this.spinVelocity *= BANANA_SPIN_VELOCITY_FACTOR;
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
        this.shootInterval = this.calcShootWaitTime();
        this.lastShotTime = Date.now();
        this.createdAt = Date.now();
        this.lifetime = MONKEY_LIFETIME;
    }

    calcShootWaitTime() {
        return MONKEY_SHOOTINTERVAL_MIN + Math.random() * MONKEY_SHOOTINTERVAL_EXTENSION;
    }

    update() {
        // Löschen
        if (Date.now() - this.createdAt > this.lifetime) {
            this.toRemove = true;
            return false;
        }

        // Pfeile schießen
        if (Date.now() - this.lastShotTime > this.shootInterval) {
            this.shootArrow();
            this.lastShotTime = Date.now();
            this.shootInterval = this.calcShootWaitTime();
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
        return true;
    }

    shootArrow() {
        const angle = Math.random() * Math.PI * 2;
        const speed = ARROW_SPEED_MIN + Math.random() * ARROW_SPEED_EXTENSION;
        this.arrows.push(new Arrow(this.x, this.y, angle, speed));
    }

    draw() {
        // Affen-Emoji zeichnen
        ctx.font = `${MONKEY_FONTSIZE}px serif`;
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
        this.shootInterval = this.calcShootWaitTime();
        this.createdAt = Date.now();
        this.lifetime = ORANGUTAN_LIFETIME;
    }

    calcShootWaitTime() {
        return ORANGUTAN_SHOOTINTERVAL_MIN + Math.random() * ORANGUTAN_SHOOTINTERVAL_EXTENSION;
    }

    update() {
        // Löschen
        if (Date.now() - this.createdAt > this.lifetime) {
            this.toRemove = true;
            return false;
        }
        // Emoji zeichnen
        ctx.font = `${ORANGUTAN_FONTSIZE}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("🦧", this.x, this.y);

        // Bananen werfen
        const now = Date.now();
        if (now - this.lastShot > this.shootInterval) {
            bananas.push(new Banana(this.x, this.y));
            this.lastShot = now;
        }
        return true;
    }
}


class Banana {
    constructor(x, y) {
        const radius = BANANA_RADIUS;
        const angle = Math.random() * Math.PI * 2;
        const speed = BANANA_FORCE_MIN + Math.random() * BANANA_FORCE_EXTENSION;
        this.body = Bodies.circle(x, y, radius, {
            frictionAir: BANANA_FRICTIONAIR,     // Verlangsamt sich
            restitution: BANANA_RESTITUTION,      // Prallt ab
            label: "banana"
        });
        this.createdAt = Date.now();
        this.lifetime = BANANA_LIFETIME;
        Body.setVelocity(this.body, {
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed
        });
        World.add(world, this.body);
    }

    draw() {
        const x = this.body.position.x;
        const y = this.body.position.y;
        ctx.font = `${BANANA_FONTSIZE}px serif`;
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
        this.radius = ARROW_RADIUS; // für Kollisionsabfrage (ungefähr)
        this.toRemove = false;
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
        ctx.font = `${ARROW_FONTSIZE}px serif`;
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
        const radius = MOUSE_CIRCLE_RADIUS;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.fill();
    }

}

function handleBananaCollision() {
    for (let bananaIndex = 0; bananaIndex < bananas.length; bananaIndex++) {
        const banana = bananas[bananaIndex];

        if (Date.now() - banana.createdAt > banana.lifetime) {
            World.remove(world, banana.body);
            bananas.splice(bananaIndex, 1);
            continue;
        }
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


                // 🌀 Add random spin
                const spin = (Math.random() * BANANA_SPIN_FORCE_EXTENSION + BANANA_SPIN_FORCE_MIN) * (Math.random() < 0.5 ? -1 : 1);
                bubble.spinVelocity = spin
                Body.setAngularVelocity(bubble.body, spin);
            }
        }
    }
}



const bubbles = [];
for (let i = 0; i < BUBBLE_COUNT; i++) {
    bubbles.push(new Bubble(true));
}
const towers = [];
const bananas = [];

const globalWind = new Wind(GLOBAL_WIND_FORCEMIN, GLOBAL_WIND_FORCEEXTENSION, GLOBAL_WIND_WAITTIMEMIN, GLOBAL_WIND_WAITTIMEEXTENSION, GLOBAL_WIND_DURATIONMIN, GLOBAL_WIND_DURATIONEXTENSION, bubbles);


function animate() {
    Engine.update(engine);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    handleMouseCircle();
    handleBananaCollision();

    towers.forEach((t, i) => {
        const keep = t.update();
        if (!keep) towers.splice(i, 1);
    });

    for (let b of bubbles) {
        b.update();
        globalWind.update();
    }

    requestAnimationFrame(animate);
}

const infoBtn = document.getElementById('infoBtn');
const infoText = document.getElementById('infoText');

infoBtn.addEventListener('click', () => {
    infoText.classList.toggle('hidden');
});


animate();



























