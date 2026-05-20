document.addEventListener("DOMContentLoaded", () => {

    const API_TOKEN = "SECRET";

    const runBtn = document.getElementById("runBallBeamBtn");
    const statusEl = document.getElementById("ballBeamStatus");
    const outputEl = document.getElementById("ballBeamOutput");

    const targetInput = document.getElementById("ballBeamTarget");
    const initialVelocityInput = document.getElementById("ballBeamInitialVelocity");
    const initialAccelerationInput = document.getElementById("ballBeamInitialAcceleration");
    loadBallBeamParamsFromUrl();

    const chartCanvas = document.getElementById("ballBeamChart");
    const animationCanvas = document.getElementById("ballBeamAnimation");
    const animationCtx = animationCanvas.getContext("2d");

    let ballBeamChart = null;

    let animationFrameId = null;
    let animationIndex = 0;
    let animationData = null;

    if (runBtn) {
        runBtn.addEventListener("click", runBallBeamSimulation);
    }

    window.addEventListener("languagechange", () => {

        if (runBtn && !runBtn.disabled) {
            runBtn.innerText = t("ballbeam.run");
        }

        if (ballBeamChart) {
            ballBeamChart.data.datasets[0].label = t("ballbeam.positionLabel");
            ballBeamChart.data.datasets[1].label = t("ballbeam.angleLabel");
            ballBeamChart.update();
        }

    });

    async function runBallBeamSimulation() {
        showLoadingOverlay(
            "ballbeam.running"
        );
        setStatus(t("common.loading"), "running");

        runBtn.disabled = true;
        runBtn.innerText = t("console.executing");

        outputEl.innerHTML = `
            <div class="console-loading">
                <div class="console-spinner"></div>
                <div>${escapeHtml(t("ballbeam.running"))}</div>
            </div>
        `;

        const payload = {
            r: Number(targetInput.value),
            init_speed: Number(initialVelocityInput.value),
            init_accel: Number(initialAccelerationInput.value)
        };

        try {

            const response = await fetch(
                "/api/simulate/ball-beam",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${API_TOKEN}`
                    },

                    body: JSON.stringify(payload)
                }
            );

            const data = await response.json();

            outputEl.innerHTML = `
                <div class="console-result">
${escapeHtml(formatCompactApiOutput(data))}
                </div>
            `;

            const parsed = parseBallBeamData(data);

            if (!parsed || parsed.labels.length === 0) {

                setStatus(t("ballbeam.noGraph"), "error");

                return;
            }

            renderBallBeamChart(parsed);

            startBallBeamAnimation(parsed);

            setStatus(t("common.success"), "success");
            showToast(
                "toast.ballbeamSuccess",
                "success"
            );

        } catch (error) {

            console.error(error);

            outputEl.innerHTML = `
                <div class="console-error">
                    ${escapeHtml(t("ballbeam.failed"))}
                </div>
            `;

            setStatus(t("common.error"), "error");
            showToast(
                "toast.ballbeamError",
                "error"
            );

        } finally {
            hideLoadingOverlay();
            runBtn.disabled = false;
            runBtn.innerText = t("ballbeam.run");
        }
    }

    function parseBallBeamData(data) {

        const source = data.result || data.data || data;

        const time =
            source.t ||
            source.time ||
            source.times ||
            [];

        let position =
            source.position ||
            source.positions ||
            source.ballPosition ||
            source.ball_position ||
            [];

        let angle =
            source.angle ||
            source.angles ||
            source.beamAngle ||
            source.beam_angle ||
            [];

        /*
            Common Octave output:
            y = ball position
            x(:,3) = beam angle
        */

        if (source.y && Array.isArray(source.y)) {

            if (Array.isArray(source.y[0])) {

                position = source.y.map(row => Number(row[0]));

            } else {

                position = source.y.map(value => Number(value));
            }
        }

        if (source.x && Array.isArray(source.x)) {

            if (Array.isArray(source.x[0]) && source.x[0].length >= 3) {

                angle = source.x.map(row => Number(row[2]));
            }
        }

        const labels = time.map(value => Number(value));

        if (!labels.length || !position.length) {
            return null;
        }

        if (!angle || angle.length === 0) {
            angle = labels.map(() => 0);
        }

        return {
            labels,
            position,
            angle
        };
    }

    function renderBallBeamChart(parsed) {

        if (ballBeamChart) {
            ballBeamChart.destroy();
        }

        ballBeamChart = new Chart(chartCanvas, {
            type: "line",

            data: {
                labels: parsed.labels,

                datasets: [
                    {
                        label: t("ballbeam.positionLabel"),
                        data: parsed.position,
                        borderWidth: 3,
                        tension: 0.35
                    },
                    {
                        label: t("ballbeam.angleLabel"),
                        data: parsed.angle,
                        borderWidth: 3,
                        tension: 0.35
                    }
                ]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,

                interaction: {
                    mode: "index",
                    intersect: false
                },

                plugins: {
                    legend: {
                        position: "bottom"
                    }
                },

                scales: {
                    x: {
                        title: {
                            display: true,
                            text: "Time"
                        }
                    },

                    y: {
                        title: {
                            display: true,
                            text: "Value"
                        }
                    }
                }
            }
        });
    }

    function startBallBeamAnimation(parsed) {

        animationData = parsed;
        animationIndex = 0;

        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }

        drawBallBeamFrame(0);

        animateBallBeam();
    }

    function animateBallBeam() {

        if (!animationData) {
            return;
        }

        drawBallBeamFrame(animationIndex);

        animationIndex++;

        if (animationIndex >= animationData.labels.length) {
            animationIndex = animationData.labels.length - 1;
            return;
        }

        animationFrameId = requestAnimationFrame(() => {

            setTimeout(() => {
                animateBallBeam();
            }, 35);

        });
    }

    function drawBallBeamFrame(index) {

        const ctx = animationCtx;
        const canvas = animationCanvas;

        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);

        drawBackground(ctx, width, height);

        const ballPosition = Number(animationData.position[index] || 0);
        const beamAngle = Number(animationData.angle[index] || 0);

        const centerX = width / 2;
        const centerY = height * 0.55;

        drawBeamSystem(
            ctx,
            centerX,
            centerY,
            ballPosition,
            beamAngle
        );

        drawTimeLabel(ctx, animationData.labels[index], width);
    }

    function drawBackground(ctx, width, height) {

        ctx.save();

        ctx.fillStyle = "rgba(255,255,255,0.88)";
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = "rgba(129,166,198,0.12)";
        ctx.lineWidth = 1;

        for (let x = 0; x < width; x += 45) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }

        for (let y = 0; y < height; y += 45) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        ctx.restore();
    }

    function drawBeamSystem(ctx, centerX, centerY, ballPosition, beamAngle) {

        /*
            The physical beam angle is usually very small,
            therefore we visually amplify it.
        */

        const visualAngle = beamAngle * 16;

        const beamLength = 620;
        const beamThickness = 14;

        const half = beamLength / 2;

        const leftX = centerX - Math.cos(visualAngle) * half;
        const leftY = centerY - Math.sin(visualAngle) * half;

        const rightX = centerX + Math.cos(visualAngle) * half;
        const rightY = centerY + Math.sin(visualAngle) * half;

        drawSupport(ctx, centerX, centerY);
        drawBeam(ctx, leftX, leftY, rightX, rightY, beamThickness);

        const normalizedBallPosition = normalizeBallPosition(ballPosition);

        const ballX =
            centerX +
            Math.cos(visualAngle) * normalizedBallPosition;

        const ballY =
            centerY +
            Math.sin(visualAngle) * normalizedBallPosition -
            28;

        drawBall(ctx, ballX, ballY);
        drawPositionLabel(ctx, ballPosition, centerX, centerY);
    }

    function normalizeBallPosition(position) {

        /*
            Expected target values are around 0.25 or 0.5.
            This maps them visually to pixels on the beam.
        */

        const visualScale = 480;

        let value = position * visualScale;

        const maxOffset = 285;

        if (value > maxOffset) {
            value = maxOffset;
        }

        if (value < -maxOffset) {
            value = -maxOffset;
        }

        return value;
    }

    function drawBeam(ctx, leftX, leftY, rightX, rightY, thickness) {

        ctx.save();

        ctx.strokeStyle = "#81A6C6";
        ctx.lineWidth = thickness;
        ctx.lineCap = "round";

        ctx.beginPath();
        ctx.moveTo(leftX, leftY);
        ctx.lineTo(rightX, rightY);
        ctx.stroke();

        ctx.strokeStyle = "rgba(47,47,47,0.12)";
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(leftX, leftY + 15);
        ctx.lineTo(rightX, rightY + 15);
        ctx.stroke();

        ctx.restore();
    }

    function drawSupport(ctx, x, y) {

        ctx.save();

        ctx.fillStyle = "#D2C4B4";

        ctx.beginPath();
        ctx.moveTo(x, y + 16);
        ctx.lineTo(x - 42, y + 105);
        ctx.lineTo(x + 42, y + 105);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = "#b7a796";
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = "#81A6C6";

        ctx.beginPath();
        ctx.arc(x, y, 13, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    function drawBall(ctx, x, y) {

        ctx.save();

        const gradient = ctx.createRadialGradient(
            x - 8,
            y - 10,
            4,
            x,
            y,
            26
        );

        gradient.addColorStop(0, "#ffffff");
        gradient.addColorStop(0.4, "#F3E3D0");
        gradient.addColorStop(1, "#D2C4B4");

        ctx.fillStyle = gradient;

        ctx.beginPath();
        ctx.arc(x, y, 25, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "#b7a796";
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.restore();
    }

    function drawPositionLabel(ctx, position, centerX, centerY) {

        ctx.save();

        ctx.fillStyle = "#5f6b7a";
        ctx.font = "18px Consolas";

        ctx.fillText(
            `position = ${Number(position).toFixed(3)} m`,
            centerX - 110,
            centerY + 145
        );

        ctx.restore();
    }

    function drawTimeLabel(ctx, time, width) {

        ctx.save();

        ctx.fillStyle = "#5f6b7a";
        ctx.font = "18px Consolas";

        ctx.fillText(`t = ${Number(time).toFixed(2)} s`, width - 160, 38);

        ctx.restore();
    }

    function setStatus(text, state) {

        statusEl.innerText = text;

        statusEl.classList.remove(
            "running",
            "success",
            "error"
        );

        if (state) {
            statusEl.classList.add(state);
        }
    }

    function escapeHtml(value) {

        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function formatCompactApiOutput(value, indent = 0) {

        const space = "  ".repeat(indent);
        const nextSpace = "  ".repeat(indent + 1);

        if (Array.isArray(value)) {
            return `[${value.map(item => formatCompactArrayItem(item)).join(", ")}]`;
        }

        if (value && typeof value === "object") {

            const entries = Object.entries(value);

            if (!entries.length) {
                return "{}";
            }

            return [
                "{",
                ...entries.map(([key, item]) => {
                    return `${nextSpace}${JSON.stringify(key)}: ${formatCompactApiOutput(item, indent + 1)}`;
                }),
                `${space}}`
            ].join("\n");
        }

        return JSON.stringify(value);
    }

    function formatCompactArrayItem(value) {

        if (Array.isArray(value)) {
            return `[${value.map(item => formatCompactArrayItem(item)).join(", ")}]`;
        }

        if (value && typeof value === "object") {
            return formatCompactApiOutput(value);
        }

        return JSON.stringify(value);
    }
    function loadBallBeamParamsFromUrl() {

        const params = new URLSearchParams(window.location.search);

        if (params.has("r")) {
            targetInput.value = params.get("r");
        }

        if (params.has("initRychlost")) {
            initialVelocityInput.value = params.get("initRychlost");
        }

        if (params.has("initZrychlenie")) {
            initialAccelerationInput.value = params.get("initZrychlenie");
        }

        if (params.has("init_speed")) {
            initialVelocityInput.value = params.get("init_speed");
        }

        if (params.has("init_accel")) {
            initialAccelerationInput.value = params.get("init_accel");
        }

        if (
            params.has("r") ||
            params.has("initRychlost") ||
            params.has("initZrychlenie") ||
            params.has("init_speed") ||
            params.has("init_accel")
        ) {
            outputEl.innerHTML = `
            <div class="console-info">
                <div class="console-label">
                    INFO
                </div>

                <div>
                    Simulation parameters were loaded from request log.
                    You can run the simulation again.
                </div>
            </div>
        `;
        }
    }

    function t(key) {
        return window.i18n ? window.i18n.t(key) : key;
    }

});
