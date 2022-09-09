let options = {
    numberOfParticles: 100,
    lineMaxLength: 200,
    particleSpeed: 1,
    particleRadius: 5,
    canvasBackgroundColor: '0 0 0',
    particleColor: '255 255 255',
    lineColor: '255 255 255',
    fps: 240
}

class Canvas {
    constructor() {
        this.canvas = document.querySelector('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.init();
    }

    init() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        window.wallpaperPropertyListener = {
            applyUserProperties: properties => {
                if(properties.backgroundcolor) options.canvasBackgroundColor = rgbString(properties.backgroundcolor.value);
                if(properties.particlecolor) options.particleColor = rgbString(properties.particlecolor.value);
                if(properties.linecolor) options.lineColor = rgbString(properties.linecolor.value);
                if(properties.particleradius) options.particleRadius = properties.particleradius.value;
                if(properties.particleconnectingdistance) options.lineMaxLength = properties.particleconnectingdistance.value;
                if(properties.particlespeed) options.particleSpeed = properties.particlespeed.value;
                if(properties.numberofparticles) {
                    options.numberOfParticles = properties.numberofparticles.value;
                    particles.generateNew(options.numberOfParticles);
                }
            },
            applyGeneralProperties: properties => { if(properties.fps) options.fps = properties.fps; }
        }
    }

    render() {
        this.ctx.fillStyle = rgb(options.canvasBackgroundColor);
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

class Particle extends Canvas {
    constructor(x, y, velocityX, velocityY, id) {
        super();
        this.x = x;
        this.y = y;
        this.velocityX = velocityX;
        this.velocityY = velocityY;
        this.id = id;
        this.distance = [];
        this.closest = null;
        this.connected = false;
    }

    move() {
        this.x += this.velocityX * options.particleSpeed;
        this.y += this.velocityY * options.particleSpeed;
    }

    checkForCollision() {
        if(this.x + options.particleRadius >= this.canvas.width || this.x - options.particleRadius <= 0) this.velocityX = -this.velocityX;
        if(this.y + options.particleRadius >= this.canvas.height || this.y - options.particleRadius <= 0) this.velocityY = -this.velocityY;
    }

    calculateDistance(particles) {
        particles.forEach(particle => {
            const distance = Math.sqrt(Math.pow(particle.x - this.x, 2) + Math.pow(particle.y - this.y, 2));
            this.distance[particle.id] = distance;
        });
        this.closest = Math.min(...this.distance.filter(distance => distance !== 0));
    }

    connect(particles) {
        particles.forEach(particle => {
            if(this.distance[particle.id] < options.lineMaxLength && !particle.connected && !this.connected){
                const opacity = 1 - (this.distance[particle.id]/options.lineMaxLength);
                this.ctx.strokeStyle = rgb(options.lineColor, opacity);
                this.ctx.beginPath();
                this.ctx.moveTo(this.x, this.y);
                this.ctx.lineTo(particle.x, particle.y);
                this.ctx.stroke();
                particle.connected = true;
            }
            else {
                particle.connected = false;
            }
        });
    }

    render() {
        this.checkForCollision();
        this.move();
 
        const opacity = 1 - (this.closest/options.lineMaxLength);
        this.ctx.fillStyle = rgb(options.particleColor, opacity);
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, options.particleRadius, 0, 2 * Math.PI, false);
        this.ctx.fill();
    }
}

class ParticleManager extends Canvas {
    constructor(particles) {
        super();
        this.particles = particles || [];
    }

    generate(number) {
        for(let i=0; i<number; i++) {
            const randomVelocity = Math.random();
            let velocityX = randomVelocity;
            let velocityY = 1 - randomVelocity;

            velocityX *= Math.round(Math.random()) ? 1 : -1;
            velocityY *= Math.round(Math.random()) ? 1 : -1;

            const x = Math.floor(Math.random() * ((this.canvas.width - options.particleRadius) - options.particleRadius + 1)) + options.particleRadius;
            const y = Math.floor(Math.random() * ((this.canvas.height - options.particleRadius) - options.particleRadius + 1)) + options.particleRadius;

            this.particles.push(new Particle(x, y, velocityX, velocityY, i));
        }
    }

    generateNew(number) {
        this.particles = [];
        this.generate(number);
    }

    render() {
        this.particles.forEach(particle => {
            particle.calculateDistance(this.particles)
            particle.render()
            particle.connect(this.particles)
        });
    }
}

function rgb(string, opacity) {
    return `rgba(${string.split(' ')},${opacity || 1})`;
}

function rgbString(color) {
    return color.split(' ').map(color => Math.ceil(color*255)).join(' ');
}

const canvas = new Canvas();
const particles = new ParticleManager();
particles.generate(options.numberOfParticles);

let last = performance.now() / 1000;
let fpsThreshold = 0;

function animationLoop() {
    requestAnimationFrame(animationLoop);
    let now = performance.now() / 1000;
    let dt = Math.min(now - last, 1);
    last = now;

    if(options.fps > 0) {
        fpsThreshold += dt;
        if (fpsThreshold < 1.0 / options.fps) return;
        fpsThreshold -= 1.0 / options.fps;
    }

    canvas.render();
    particles.render();
}

requestAnimationFrame(animationLoop);
