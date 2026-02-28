document.addEventListener('DOMContentLoaded', () => {

    // ─── Particle Background ───────────────────────────────────────
    const canvas = document.getElementById('bg-canvas');
    const ctx = canvas.getContext('2d');
    let particles = [];
    let animationId;

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    class Particle {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 1.8 + 0.3;
            this.speedX = (Math.random() - 0.5) * 0.3;
            this.speedY = (Math.random() - 0.5) * 0.3;
            this.opacity = Math.random() * 0.5 + 0.1;
            this.pulse = Math.random() * Math.PI * 2;
            this.pulseSpeed = Math.random() * 0.02 + 0.005;
            // Subtle color variation: purple to cyan
            const t = Math.random();
            this.r = Math.round(124 * (1 - t) + 6 * t);
            this.g = Math.round(58 * (1 - t) + 182 * t);
            this.b = Math.round(237 * (1 - t) + 212 * t);
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            this.pulse += this.pulseSpeed;

            if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
            if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
        }

        draw() {
            const currentOpacity = this.opacity * (0.6 + 0.4 * Math.sin(this.pulse));
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${this.r}, ${this.g}, ${this.b}, ${currentOpacity})`;
            ctx.fill();
        }
    }

    function initParticles() {
        const count = Math.min(80, Math.floor((canvas.width * canvas.height) / 15000));
        particles = [];
        for (let i = 0; i < count; i++) {
            particles.push(new Particle());
        }
    }

    function drawLines() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 120) {
                    const alpha = (1 - dist / 120) * 0.08;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(124, 58, 237, ${alpha})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }
    }

    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        drawLines();
        animationId = requestAnimationFrame(animateParticles);
    }

    resizeCanvas();
    initParticles();
    animateParticles();

    window.addEventListener('resize', () => {
        resizeCanvas();
        initParticles();
    });

    // ─── Card Mouse-Tracking Glow ──────────────────────────────────
    const cards = document.querySelectorAll('.card');

    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            card.style.setProperty('--mouse-x', x + '%');
            card.style.setProperty('--mouse-y', y + '%');
        });

        card.addEventListener('mouseleave', () => {
            card.style.setProperty('--mouse-x', '50%');
            card.style.setProperty('--mouse-y', '50%');
        });
    });

    // ─── Staggered Entrance Animation ──────────────────────────────
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = `opacity 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${index * 0.12}s, transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${index * 0.12}s`;

        setTimeout(() => {
            card.style.opacity = '';
            card.style.transform = '';
        }, 80);
    });

    // ─── Language Toggle ───────────────────────────────────────────
    const langBtn = document.getElementById('lang-toggle');
    let currentLang = 'ko';

    if (langBtn) {
        langBtn.addEventListener('click', () => {
            currentLang = currentLang === 'ko' ? 'en' : 'ko';
            langBtn.textContent = currentLang === 'ko' ? 'EN' : 'KO';

            const elementsToTranslate = document.querySelectorAll('[data-ko][data-en]');
            elementsToTranslate.forEach(el => {
                el.textContent = el.getAttribute(`data-${currentLang}`);
            });

            document.documentElement.lang = currentLang;
        });
    }

});
