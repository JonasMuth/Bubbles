const canvas = document.getElementById("bubbleCanvas");
const ctx = canvas.getContext("2d");

// Canvas-Größe an Fenster anpassen
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();
















// Bubble-Daten
class Bubble {
    constructor() {
        this.radius = Math.random() * 40 + 20;
        this.x = Math.random() * (canvas.width - 2 * this.radius) + this.radius;
        this.y = Math.random() * (canvas.height - 2 * this.radius) + this.radius;

        const speed = Math.random() * 0.5 + 0.2;
        const angle = Math.random() * Math.PI * 2;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;

        const r = Math.floor(Math.random() * 100 + 155);
        const g = Math.floor(Math.random() * 100 + 155);
        const b = Math.floor(Math.random() * 100 + 155);
        this.color = `rgba(${r}, ${g}, ${b}, 0.2)`;
    }

    draw() {
        const gradient = ctx.createRadialGradient(
            this.x, this.y, this.radius * 0.2,
            this.x, this.y, this.radius
        );
        gradient.addColorStop(0, "white");
        gradient.addColorStop(1, this.color);

        ctx.beginPath();
        ctx.fillStyle = gradient;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
        ctx.lineWidth = 1.5;
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        // Randkollision
        if (this.x - this.radius < 0 || this.x + this.radius > canvas.width) {
            this.vx *= -1;
        }
        if (this.y - this.radius < 0 || this.y + this.radius > canvas.height) {
            this.vy *= -1;
        }

        this.draw();
    }


}

// Bubbles erzeugen
const bubbles = [];
const bubbleCount = 30;
for (let i = 0; i < bubbleCount; i++) {
    bubbles.push(new Bubble());
}

// Animation
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let b of bubbles) {
        b.update();
    }
    requestAnimationFrame(animate);
}

animate();
