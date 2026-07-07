<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	interface Particle {
		x: number;
		y: number;
		vx: number;
		vy: number;
		radius: number;
		alpha: number;
		pulse: number;
		pulseSpeed: number;
	}

	interface ShootingStar {
		x: number;
		y: number;
		length: number;
		angle: number;
		speed: number;
		alpha: number;
		life: number;
		maxLife: number;
	}

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D | null = null;
	let animationFrame: number;
	let particles: Particle[] = [];
	let shootingStars: ShootingStar[] = [];
	let dpr = $state(1);
	let prefersReducedMotion = $state(false);

	const PARTICLE_COUNT = 70;
	const CONNECTION_DISTANCE = 150;
	const MAX_CONNECTIONS = 3;
	const SHOOTING_STAR_INTERVAL = 2500;

	function resize() {
		if (!canvas) return;
		dpr = Math.min(window.devicePixelRatio || 1, 2);
		canvas.width = window.innerWidth * dpr;
		canvas.height = window.innerHeight * dpr;
		canvas.style.width = `${window.innerWidth}px`;
		canvas.style.height = `${window.innerHeight}px`;
		if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
	}

	function createParticle(): Particle {
		return {
			x: Math.random() * window.innerWidth,
			y: Math.random() * window.innerHeight,
			vx: (Math.random() - 0.5) * 0.4,
			vy: (Math.random() - 0.5) * 0.4,
			radius: Math.random() * 1.5 + 0.5,
			alpha: Math.random() * 0.5 + 0.3,
			pulse: Math.random() * Math.PI * 2,
			pulseSpeed: Math.random() * 0.02 + 0.01,
		};
	}

	function createShootingStar(): ShootingStar {
		const startY = Math.random() * window.innerHeight * 0.4;
		const startX = Math.random() * window.innerWidth * 0.3;
		const angle = Math.PI / 4 + (Math.random() - 0.5) * 0.2;
		return {
			x: startX,
			y: startY,
			length: 120 + Math.random() * 80,
			angle,
			speed: 8 + Math.random() * 6,
			alpha: 1,
			life: 0,
			maxLife: 60 + Math.random() * 40,
		};
	}

	function init() {
		particles = Array.from({ length: PARTICLE_COUNT }, createParticle);
		shootingStars = [];
	}

	let lastShootingStar = 0;
	let frameCount = 0;

	function draw() {
		if (!ctx || !canvas) return;
		const width = window.innerWidth;
		const height = window.innerHeight;

		ctx.clearRect(0, 0, width, height);

		// Connections first (behind particles).
		for (let i = 0; i < particles.length; i++) {
			let connections = 0;
			for (let j = i + 1; j < particles.length && connections < MAX_CONNECTIONS; j++) {
				const dx = particles[i].x - particles[j].x;
				const dy = particles[i].y - particles[j].y;
				const distance = Math.sqrt(dx * dx + dy * dy);

				if (distance < CONNECTION_DISTANCE) {
					connections++;
					const opacity = (1 - distance / CONNECTION_DISTANCE) * 0.25 * particles[i].alpha;
					const gradient = ctx.createLinearGradient(
						particles[i].x,
						particles[i].y,
						particles[j].x,
						particles[j].y
					);
					gradient.addColorStop(0, `rgba(255, 179, 0, ${opacity})`);
					gradient.addColorStop(1, `rgba(255, 201, 51, ${opacity * 0.6})`);
					ctx.beginPath();
					ctx.strokeStyle = gradient;
					ctx.lineWidth = 0.5;
					ctx.moveTo(particles[i].x, particles[i].y);
					ctx.lineTo(particles[j].x, particles[j].y);
					ctx.stroke();
				}
			}
		}

		// Particles.
		for (const p of particles) {
			p.pulse += p.pulseSpeed;
			const pulseFactor = Math.sin(p.pulse) * 0.3 + 0.7;
			const alpha = p.alpha * pulseFactor;

			ctx.beginPath();
			ctx.arc(p.x, p.y, p.radius * pulseFactor, 0, Math.PI * 2);
			ctx.fillStyle = `rgba(255, 179, 0, ${alpha})`;
			ctx.fill();

			// Soft glow for larger particles.
			if (p.radius > 1.2) {
				const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 6);
				glow.addColorStop(0, `rgba(255, 179, 0, ${alpha * 0.4})`);
				glow.addColorStop(1, 'rgba(255, 179, 0, 0)');
				ctx.beginPath();
				ctx.arc(p.x, p.y, p.radius * 6, 0, Math.PI * 2);
				ctx.fillStyle = glow;
				ctx.fill();
			}
		}

		// Shooting stars.
		for (let i = shootingStars.length - 1; i >= 0; i--) {
			const s = shootingStars[i];
			s.life++;
			s.x += Math.cos(s.angle) * s.speed;
			s.y += Math.sin(s.angle) * s.speed;
			s.alpha = Math.max(0, 1 - s.life / s.maxLife);

			if (s.life >= s.maxLife || s.x > width + s.length || s.y > height + s.length) {
				shootingStars.splice(i, 1);
				continue;
			}

			const tailX = s.x - Math.cos(s.angle) * s.length;
			const tailY = s.y - Math.sin(s.angle) * s.length;
			const gradient = ctx.createLinearGradient(s.x, s.y, tailX, tailY);
			gradient.addColorStop(0, `rgba(255, 255, 255, ${s.alpha})`);
			gradient.addColorStop(0.3, `rgba(255, 201, 51, ${s.alpha * 0.9})`);
			gradient.addColorStop(1, 'rgba(255, 179, 0, 0)');

			ctx.beginPath();
			ctx.strokeStyle = gradient;
			ctx.lineWidth = 2;
			ctx.moveTo(s.x, s.y);
			ctx.lineTo(tailX, tailY);
			ctx.stroke();
		}

		animationFrame = requestAnimationFrame(draw);
	}

	function updatePositions() {
		if (prefersReducedMotion) return;
		frameCount++;

		for (const p of particles) {
			p.x += p.vx;
			p.y += p.vy;

			if (p.x < 0 || p.x > window.innerWidth) p.vx *= -1;
			if (p.y < 0 || p.y > window.innerHeight) p.vy *= -1;
		}

		if (frameCount - lastShootingStar > SHOOTING_STAR_INTERVAL / 16) {
			if (Math.random() > 0.6) {
				shootingStars.push(createShootingStar());
			}
			lastShootingStar = frameCount;
		}
	}

	let motionTimer: ReturnType<typeof setInterval>;

	onMount(() => {
		ctx = canvas.getContext('2d');
		prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

		resize();
		init();
		draw();

		if (!prefersReducedMotion) {
			motionTimer = setInterval(updatePositions, 16);
		}

		const handleResize = () => {
			resize();
			init();
		};
		const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
		const handleMotionChange = (e: MediaQueryListEvent) => {
			prefersReducedMotion = e.matches;
			if (prefersReducedMotion && motionTimer) {
				clearInterval(motionTimer);
				motionTimer = undefined as unknown as ReturnType<typeof setInterval>;
			} else if (!prefersReducedMotion && !motionTimer) {
				motionTimer = setInterval(updatePositions, 16);
			}
		};

		window.addEventListener('resize', handleResize);
		mediaQuery.addEventListener('change', handleMotionChange);

		return () => {
			window.removeEventListener('resize', handleResize);
			mediaQuery.removeEventListener('change', handleMotionChange);
		};
	});

	onDestroy(() => {
		cancelAnimationFrame(animationFrame);
		if (motionTimer) clearInterval(motionTimer);
	});
</script>

<canvas
	bind:this={canvas}
	class="pointer-events-none absolute inset-0 -z-10"
	aria-hidden="true"
></canvas>
