/* =========================================
   Liquid Glass Theme
   Starfield + Nebula + Two-level Stars
   + Low-frequency Meteors
   ========================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =========================================
       Create Canvas
       ========================================= */

    const canvas = document.createElement("canvas");

    canvas.id = "starfield";

    document.body.prepend(canvas);

    const ctx = canvas.getContext("2d");


    /* =========================================
       State
       ========================================= */

    let stars = [];

    let meteors = [];

    let mouseTrails = [];

    let mouseX = 0;

    let mouseY = 0;

    let lastMouseX = 0;

    let lastMouseY = 0;

    let lastMouseTime = 0;

    let nextMeteorTime = 3000;


    /* =========================================
       Resize
       ========================================= */

    function resizeCanvas() {

        const dpr =
            Math.min(window.devicePixelRatio || 1, 2);

        canvas.width =
            window.innerWidth * dpr;

        canvas.height =
            window.innerHeight * dpr;

        canvas.style.width =
            window.innerWidth + "px";

        canvas.style.height =
            window.innerHeight + "px";

        ctx.setTransform(
            dpr,
            0,
            0,
            dpr,
            0,
            0
        );

        createStars();
    }


    /* =========================================
       Create Stars
       ========================================= */


    /* =========================================
   Mouse Star Trail
   ========================================= */

function createMouseTrail(x, y, vx, vy) {

    const speed =
        Math.sqrt(vx * vx + vy * vy);

    if (speed < 8) {
        return;
    }

    mouseTrails.push({

        x: x,

        y: y,

        vx: vx * 0.35,

        vy: vy * 0.35,

        life: 0,

        maxLife: 24,

        size: Math.min(
            2.8,
            1.1 + speed * 0.025
        )
    });


    /*
     * Limit the number of mouse stars.
     * This keeps the effect elegant instead
     * of turning into a neon cursor trail.
     */

    if (mouseTrails.length > 18) {

        mouseTrails.shift();

    }
}

    function createStars() {

        stars = [];

        const count =
            Math.floor(
                (window.innerWidth *
                window.innerHeight) / 9000
            );

        for (let i = 0; i < count; i++) {

            const important =
                Math.random() < 0.12;

            stars.push({

                x:
                    Math.random() *
                    window.innerWidth,

                y:
                    Math.random() *
                    window.innerHeight,

                radius:
                    important
                        ? Math.random() * 1.2 + 0.8
                        : Math.random() * 0.7 + 0.3,

                baseAlpha:
                    important
                        ? Math.random() * 0.35 + 0.55
                        : Math.random() * 0.35 + 0.20,

                twinkleSpeed:
                    Math.random() * 0.0015 + 0.0005,

                phase:
                    Math.random() *
                    Math.PI *
                    2,

                important
            });
        }
    }


    /* =========================================
       Blue Nebula
       ========================================= */

    function drawNebula() {

        const nebulae = [

            {
                x:
                    window.innerWidth * 0.12,

                y:
                    window.innerHeight * 0.68,

                radius:
                    Math.min(
                        window.innerWidth,
                        window.innerHeight
                    ) * 0.42,

                alpha: 0.10
            },

            {
                x:
                    window.innerWidth * 0.86,

                y:
                    window.innerHeight * 0.38,

                radius:
                    Math.min(
                        window.innerWidth,
                        window.innerHeight
                    ) * 0.38,

                alpha: 0.08
            },

            {
                x:
                    window.innerWidth * 0.52,

                y:
                    window.innerHeight * 0.05,

                radius:
                    Math.min(
                        window.innerWidth,
                        window.innerHeight
                    ) * 0.30,

                alpha: 0.06
            }
        ];


        nebulae.forEach((nebula) => {

            const gradient =
                ctx.createRadialGradient(
                    nebula.x,
                    nebula.y,
                    0,
                    nebula.x,
                    nebula.y,
                    nebula.radius
                );


            gradient.addColorStop(
                0,
                `rgba(70, 130, 255, ${nebula.alpha})`
            );

            gradient.addColorStop(
                0.45,
                `rgba(45, 90, 210, ${nebula.alpha * 0.45})`
            );

            gradient.addColorStop(
                1,
                "rgba(20, 50, 130, 0)"
            );


            ctx.beginPath();

            ctx.arc(
                nebula.x,
                nebula.y,
                nebula.radius,
                0,
                Math.PI * 2
            );

            ctx.fillStyle = gradient;

            ctx.fill();
        });
    }


    /* =========================================
       Create Meteor
       ========================================= */

    function createMeteor() {

        meteors.push({

            x:
                Math.random() *
                window.innerWidth *
                0.75,

            y:
                Math.random() *
                window.innerHeight *
                0.35,

            length:
                Math.random() * 70 + 60,

            speed:
                Math.random() * 6 + 7,

            angle:
                Math.PI / 4,

            alpha: 1,

            life: 0,

            maxLife:
                Math.random() * 20 + 25
        });
    }


    /* =========================================
       Draw Meteors
       ========================================= */

    function drawMouseTrails() {

    mouseTrails.forEach((trail) => {

        const progress =
            trail.life /
            trail.maxLife;

        const alpha =
            1 - progress;


        const tailX =
            trail.x -
            trail.vx * 12;

        const tailY =
            trail.y -
            trail.vy * 12;


        const gradient =
            ctx.createLinearGradient(
                tailX,
                tailY,
                trail.x,
                trail.y
            );


        gradient.addColorStop(
            0,
            "rgba(60, 130, 255, 0)"
        );

        gradient.addColorStop(
            0.55,
            `rgba(
                100,
                170,
                255,
                ${alpha * 0.22}
            )`
        );

        gradient.addColorStop(
            1,
            `rgba(
                225,
                242,
                255,
                ${alpha}
            )`
        );


        /* Light trail */

        ctx.beginPath();

        ctx.moveTo(
            tailX,
            tailY
        );

        ctx.lineTo(
            trail.x,
            trail.y
        );

        ctx.strokeStyle =
            gradient;

        ctx.lineWidth =
            trail.size * 0.65;

        ctx.stroke();


        /* Bright star head */

        ctx.beginPath();

        ctx.arc(
            trail.x,
            trail.y,
            trail.size,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            `rgba(
                235,
                247,
                255,
                ${alpha}
            )`;

        ctx.fill();


        /* Small glow */

        const glow =
            ctx.createRadialGradient(
                trail.x,
                trail.y,
                0,
                trail.x,
                trail.y,
                trail.size * 5
            );


        glow.addColorStop(
            0,
            `rgba(
                120,
                190,
                255,
                ${alpha * 0.35}
            )`
        );

        glow.addColorStop(
            1,
            "rgba(80, 150, 255, 0)"
        );


        ctx.beginPath();

        ctx.arc(
            trail.x,
            trail.y,
            trail.size * 5,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = glow;

        ctx.fill();


        trail.x += trail.vx;

        trail.y += trail.vy;

        trail.life++;
    });


    mouseTrails =
        mouseTrails.filter(
            (trail) =>
                trail.life <
                trail.maxLife
        );
}

    function drawMeteors() {

        meteors.forEach((meteor) => {

            const tailX =
                meteor.x -
                Math.cos(meteor.angle) *
                meteor.length;

            const tailY =
                meteor.y -
                Math.sin(meteor.angle) *
                meteor.length;


            const gradient =
                ctx.createLinearGradient(
                    tailX,
                    tailY,
                    meteor.x,
                    meteor.y
                );


            gradient.addColorStop(
                0,
                "rgba(120, 175, 255, 0)"
            );

            gradient.addColorStop(
                0.7,
                `rgba(
                    160,
                    205,
                    255,
                    ${meteor.alpha * 0.25}
                )`
            );

            gradient.addColorStop(
                1,
                `rgba(
                    230,
                    240,
                    255,
                    ${meteor.alpha}
                )`
            );


            ctx.beginPath();

            ctx.moveTo(
                tailX,
                tailY
            );

            ctx.lineTo(
                meteor.x,
                meteor.y
            );

            ctx.strokeStyle =
                gradient;

            ctx.lineWidth = 1.2;

            ctx.stroke();


            /* Meteor head */

            ctx.beginPath();

            ctx.arc(
                meteor.x,
                meteor.y,
                1.5,
                0,
                Math.PI * 2
            );

            ctx.fillStyle =
                `rgba(
                    235,
                    245,
                    255,
                    ${meteor.alpha}
                )`;

            ctx.fill();


            meteor.x +=
                Math.cos(meteor.angle) *
                meteor.speed;

            meteor.y +=
                Math.sin(meteor.angle) *
                meteor.speed;

            meteor.life++;


            meteor.alpha =
                1 -
                meteor.life /
                meteor.maxLife;
        });


        meteors =
            meteors.filter(
                (meteor) =>
                    meteor.life <
                    meteor.maxLife
            );
    }


    /* =========================================
       Draw Stars
       ========================================= */

    function drawStars(time) {

        ctx.clearRect(
            0,
            0,
            window.innerWidth,
            window.innerHeight
        );


        /* Background */

        drawNebula();


        /* Stars */

        stars.forEach((star) => {

            const twinkle =
                Math.sin(
                    time *
                    star.twinkleSpeed +
                    star.phase
                );


            const alpha =
                star.baseAlpha +
                twinkle *
                (star.important
                    ? 0.20
                    : 0.10);


            /* Important star glow */

            if (star.important) {

                const glow =
                    ctx.createRadialGradient(
                        star.x,
                        star.y,
                        0,
                        star.x,
                        star.y,
                        8
                    );


                glow.addColorStop(
                    0,
                    `rgba(
                        180,
                        215,
                        255,
                        ${Math.max(alpha, 0) * 0.65}
                    )`
                );

                glow.addColorStop(
                    1,
                    "rgba(100, 160, 255, 0)"
                );


                ctx.beginPath();

                ctx.arc(
                    star.x,
                    star.y,
                    8,
                    0,
                    Math.PI * 2
                );

                ctx.fillStyle =
                    glow;

                ctx.fill();
            }


            /* Star */

            ctx.beginPath();

            ctx.arc(
                star.x,
                star.y,
                star.radius,
                0,
                Math.PI * 2
            );

            ctx.fillStyle =
                `rgba(
                    220,
                    235,
                    255,
                    ${Math.max(alpha, 0)}
                )`;

            ctx.fill();
        });


        /* Mouse star trails */

        drawMouseTrails();


        /* Automatic meteors */
        
        drawMeteors();


        /* Schedule next meteor */

        if (
            time > nextMeteorTime &&
            meteors.length === 0
        ) {

            createMeteor();


            nextMeteorTime =
                time +
                Math.random() * 3000 +
                2000;
        }


        requestAnimationFrame(drawStars);
    }


    /* =========================================
       Initialize
       ========================================= */

    window.addEventListener(
        "resize",
        resizeCanvas
    );

    /* =========================================
   Mouse Movement
   ========================================= */

window.addEventListener(
    "pointermove",
    (event) => {

        const now =
            performance.now();


        if (lastMouseTime === 0) {

            lastMouseX =
                event.clientX;

            lastMouseY =
                event.clientY;

            lastMouseTime =
                now;

            return;
        }


        const dx =
            event.clientX -
            lastMouseX;

        const dy =
            event.clientY -
            lastMouseY;


        const dt =
            Math.max(
                now - lastMouseTime,
                8
            );


        const vx =
            dx /
            dt *
            16;


        const vy =
            dy /
            dt *
            16;


        /*
         * Only create a visible star when
         * the mouse is actually moving.
         */

        if (
            Math.abs(dx) +
            Math.abs(dy) >
            10
        ) {

            createMouseTrail(
                event.clientX,
                event.clientY,
                vx,
                vy
            );
        }


        lastMouseX =
            event.clientX;

        lastMouseY =
            event.clientY;

        lastMouseTime =
            now;
    }
);

    resizeCanvas();

    requestAnimationFrame(drawStars);

        /* =========================================
       Liquid Glass Mouse Light
       ========================================= */

    const glassElements =
        document.querySelectorAll(
            ".glass-header, .post-card, .post-detail"
        );


    glassElements.forEach((element) => {

        element.addEventListener(
            "pointermove",
            (event) => {

                const rect =
                    element.getBoundingClientRect();


                const x =
                    event.clientX -
                    rect.left;


                const y =
                    event.clientY -
                    rect.top;


                element.style.setProperty(
                    "--mouse-x",
                    `${x}px`
                );


                element.style.setProperty(
                    "--mouse-y",
                    `${y}px`
                );
            }
        );


        element.addEventListener(
            "pointerleave",
            () => {

                element.style.setProperty(
                    "--mouse-x",
                    "50%"
                );

                element.style.setProperty(
                    "--mouse-y",
                    "50%"
                );
            }
        );
    });

});