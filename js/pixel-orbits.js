(() => {
    const scene = document.querySelector('.pixel-orbits');
    const canvas = scene.querySelector('canvas');
    const toggle = scene.querySelector('button');
    const context = canvas.getContext('2d');
    if (!context) return;

    const { width, height } = canvas;
    const center = { x: 160, y: 60 };
    const tilt = 0.13;
    const fullTurn = 2 * Math.PI;
    const pixel = (ctx, x, y, color, size = 1) => {
        ctx.fillStyle = color;
        ctx.fillRect(Math.round(x), Math.round(y), size, size);
    };

    function makeLayer(width, height) {
        const layer = document.createElement('canvas');
        layer.width = width;
        layer.height = height;
        return layer;
    }

    let seed = 27;
    function random() {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        return seed / 4294967296;
    }

    const sky = makeLayer(width, height);
    const skyContext = sky.getContext('2d');
    skyContext.fillStyle = '#101125';
    skyContext.fillRect(0, 0, width, height);
    const nebula = ['#15162e', '#191a37', '#211d3d', '#292143', '#302647'];
    for (let y = 0; y < height; y += 2) {
        for (let x = 0; x < width; x += 2) {
            const band = 97 - x * 0.23 + Math.sin(x / 28) * 6;
            const density = 4 - Math.abs(y - band) / 8 + Math.sin(x / 15 + y / 10) + random();
            if (density >= 1) {
                pixel(skyContext, x, y, nebula[Math.min(4, Math.floor(density) - 1)], 2);
            }
        }
    }

    const stars = [];
    for (let index = 0; index < 164; index++) {
        const x = Math.floor(random() * width);
        const y = Math.floor(random() * height);
        const color = ['#3f4265', '#66668a', '#8589ab', '#b0a4c2'][Math.floor(random() * 4)];
        pixel(skyContext, x, y, color);
        if (index % 14 === 0) stars.push({ x, y, phase: random() * fullTurn });
    }

    const glow = skyContext.createRadialGradient(center.x, center.y, 3, center.x, center.y, 51);
    glow.addColorStop(0, '#da7e4299');
    glow.addColorStop(0.42, '#b0563740');
    glow.addColorStop(1, '#9c4b3600');
    skyContext.fillStyle = glow;
    skyContext.fillRect(center.x - 51, center.y - 51, 102, 102);

    function makeSprite(radius, colors, ringed = false) {
        const half = ringed ? radius + 7 : radius;
        const sprite = makeLayer(half * 2 + 1, half * 2 + 1);
        const ctx = sprite.getContext('2d');
        if (ringed) {
            for (let step = 0; step < 48; step++) {
                const angle = fullTurn * step / 48;
                const x = Math.cos(angle) * (half - 1);
                const y = Math.sin(angle) * 3.5 - 0.23 * x;
                pixel(ctx, half + x, half + y, '#aa698b');
            }
        }
        for (let y = -radius; y <= radius; y++) {
            for (let x = -radius; x <= radius; x++) {
                if (x * x + y * y > radius * radius + 0.5) continue;
                const relief = Math.sin(x * 0.82 + y * 0.63) * 0.35 + random() * 0.45;
                const shade = Math.floor(2.8 - (x + y) / radius * 1.55 + relief);
                pixel(ctx, half + x, half + y, colors[Math.max(0, Math.min(4, shade))]);
            }
        }
        if (ringed) {
            for (let step = 0; step <= 24; step++) {
                const angle = Math.PI * step / 24;
                const x = Math.cos(angle) * (half - 1);
                const y = Math.sin(angle) * 3.5 - 0.23 * x;
                pixel(ctx, half + x, half + y, '#f1b4a2');
            }
        }
        return sprite;
    }

    const sun = makeSprite(13, ['#b84b57', '#e47450', '#f3a753', '#ffcf70', '#ffeda9']);
    const planets = [
        { rx: 56, ry: 18, period: 11500, phase: 3.05, sprite: makeSprite(5, ['#163855', '#255777', '#398c9b', '#63c3b6', '#a5ecce']) },
        { rx: 89, ry: 29, period: 18000, phase: 0.24, sprite: makeSprite(7, ['#69384e', '#9e5368', '#d87978', '#f1aa90', '#fedaba'], true) },
        { rx: 123, ry: 40, period: 26000, phase: 2.34, sprite: makeSprite(6, ['#33345f', '#4d4b8e', '#6d6cba', '#a09ce4', '#d6caff']) }
    ];

    function orbitPosition(planet, angle) {
        const x = Math.cos(angle) * planet.rx;
        const depth = Math.sin(angle);
        return { x: center.x + x, y: center.y + depth * planet.ry - tilt * x, depth };
    }

    for (const planet of planets) {
        const steps = Math.round(planet.rx * 1.23);
        for (let step = 0; step < steps; step++) {
            const { x, y, depth } = orbitPosition(planet, fullTurn * step / steps);
            pixel(skyContext, x, y, depth >= 0 ? '#57516f' : '#42415e');
        }
    }

    function drawSprite(sprite, x, y) {
        context.drawImage(sprite, Math.round(x - (sprite.width - 1) / 2), Math.round(y - (sprite.height - 1) / 2));
    }

    function draw(elapsed) {
        context.drawImage(sky, 0, 0);
        for (const { x, y, phase } of stars) {
            const light = Math.sin(elapsed / 720 + phase);
            if (light < 0.15) continue;
            pixel(context, x, y, '#e3d9ed');
            if (light < 0.68) continue;
            context.fillStyle = '#817b9d';
            context.fillRect(x - 1, y, 3, 1);
            context.fillRect(x, y - 1, 1, 3);
            pixel(context, x, y, '#fff0d9');
        }
        const positions = planets.map(planet => ({
            ...orbitPosition(planet, planet.phase + fullTurn * elapsed / planet.period),
            sprite: planet.sprite
        }));
        for (const planet of positions.filter(planet => planet.depth < 0)) {
            drawSprite(planet.sprite, planet.x, planet.y);
        }
        drawSprite(sun, center.x, center.y);
        for (const planet of positions.filter(planet => planet.depth >= 0)) {
            drawSprite(planet.sprite, planet.x, planet.y);
        }
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let paused = reducedMotion.matches;
    let visible = !('IntersectionObserver' in window);
    let frame;
    let previous;
    let elapsed = 0;

    function animate(timestamp) {
        previous ??= timestamp;
        if (timestamp - previous >= 1000 / 30) {
            elapsed += Math.min(timestamp - previous, 100);
            previous = timestamp;
            draw(elapsed);
        }
        frame = requestAnimationFrame(animate);
    }

    function updatePlayback() {
        cancelAnimationFrame(frame);
        previous = undefined;
        if (visible && !paused && !document.hidden) frame = requestAnimationFrame(animate);
        toggle.toggleAttribute('data-paused', paused);
        toggle.setAttribute('aria-label', paused ? '播放行星动画' : '暂停行星动画');
    }

    draw(0);
    toggle.hidden = false;
    toggle.addEventListener('click', () => {
        paused = !paused;
        updatePlayback();
    });
    document.addEventListener('visibilitychange', updatePlayback);
    reducedMotion.addEventListener('change', event => {
        paused = event.matches;
        updatePlayback();
    });
    if ('IntersectionObserver' in window) {
        new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting;
            updatePlayback();
        }).observe(scene);
    }
    updatePlayback();
})();
