const canvas = document.getElementById("bubbleCanvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();


let mouse = {
    x: null,
    y: null
};

// Mausbewegung verfolgen
canvas.addEventListener("mousemove", e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

// Blase-Klasse
class Bubble {
    constructor() {
        this.radius = Math.random() * 30 + 20;
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.color = `rgba(173, 216, 230, 0.5)`;
    }

    draw() {
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        // Randkollision
        if (this.x + this.radius > canvas.width || this.x - this.radius < 0) {
            this.vx *= -1;
        }
        if (this.y + this.radius > canvas.height || this.y - this.radius < 0) {
            this.vy *= -1;
        }

        // Mauskollision – einfacher "Stupser"
        const dx = this.x - mouse.x;
        const dy = this.y - mouse.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < this.radius + 50) {
            const angle = Math.atan2(dy, dx);
            const force = (50 - distance) / 50;
            const pushX = Math.cos(angle) * force;
            const pushY = Math.sin(angle) * force;

            this.vx += pushX * 0.5;
            this.vy += pushY * 0.5;
        }

        // Trägheit reduzieren
        this.vx *= 0.98;
        this.vy *= 0.98;

        this.draw();
    }
}

// Bubbles erzeugen
const bubbles = [];
const bubbleCount = 30;
for (let i = 0; i < bubbleCount; i++) {
    bubbles.push(new Bubble());
}

// Animation starten
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let b of bubbles) {
        b.update();
    }
    requestAnimationFrame(animate);
}

animate();
