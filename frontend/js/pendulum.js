document.addEventListener("DOMContentLoaded", () => {

    const API_TOKEN = "SECRET";

    const runBtn = document.getElementById("runPendulumBtn");
    const statusEl = document.getElementById("pendulumStatus");
    const outputEl = document.getElementById("pendulumOutput");

    const targetInput = document.getElementById("pendulumTarget");
    const initialPositionInput = document.getElementById("pendulumInitialPosition");
    const initialAngleInput = document.getElementById("pendulumInitialAngle");
    loadPendulumParamsFromUrl();

    const chartCanvas = document.getElementById("pendulumChart");
    const animationCanvas = document.getElementById("pendulumAnimation");
    const animationCtx = animationCanvas.getContext("2d");

    let animationFrameId = null;
    let animationIndex = 0;
    let animationData = null;

    let pendulumChart = null;

    if (runBtn) {
        runBtn.addEventListener("click", runPendulumSimulation);
    }

    window.addEventListener("languagechange", () => {

        if (runBtn && !runBtn.disabled) {
            runBtn.innerText = t("pendulum.run");
        }

        if (pendulumChart) {
            pendulumChart.data.datasets[0].label = t("pendulum.positionLabel");

            if (pendulumChart.data.datasets[1]) {
                pendulumChart.data.datasets[1].label = t("pendulum.angleLabel");
            }

            pendulumChart.update();
        }

    });

    async function runPendulumSimulation() {
        showLoadingOverlay(
            "pendulum.running"
        );
        setStatus(t("common.loading"), "running");

        runBtn.disabled = true;
        runBtn.innerText = t("console.executing");

        outputEl.innerHTML = `
            <div class="console-loading">
                <div class="console-spinner"></div>
                <div>${escapeHtml(t("pendulum.running"))}</div>
            </div>
        `;

        const payload = {
            r: Number(targetInput.value),
            initPozicia: Number(initialPositionInput.value),
            initUhol: Number(initialAngleInput.value)
        };

        try {

            const response = await fetch(
                "/api/simulate/pendulum",
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

            const parsed = parsePendulumData(data);

            if (!parsed || parsed.labels.length === 0) {

                setStatus(t("pendulum.noGraph"), "error");

                return;
            }

            renderPendulumChart(parsed);

            startPendulumAnimation(parsed);

            setStatus(t("common.success"), "success");
            showToast(
                "toast.pendulumSuccess",
                "success"
            );

        } catch (error) {

            console.error(error);

            outputEl.innerHTML = `
                <div class="console-error">
                    ${escapeHtml(t("pendulum.failed"))}
                </div>
            `;

            setStatus(t("common.error"), "error");
            showToast(
                "toast.pendulumError",
                "error"
            );

        } finally {
            hideLoadingOverlay();
            runBtn.disabled = false;
            runBtn.innerText = t("pendulum.run");
        }
    }

    function parsePendulumData(data) {

        /*
            This parser is intentionally flexible because backend responses
            can differ depending on implementation.

            Expected useful shapes:
            - data.t, data.y
            - data.time, data.position, data.angle
            - data.result.t, data.result.y
        */

        const source = data.result || data.data || data;

        const time =
            source.t ||
            source.time ||
            source.times ||
            [];

        let position =
            source.position ||
            source.positions ||
            [];

        let angle =
            source.angle ||
            source.angles ||
            [];

        if (source.y && Array.isArray(source.y)) {

            if (Array.isArray(source.y[0])) {

                position = source.y.map(row => Number(row[0]));
                angle = source.y.map(row => Number(row[1]));

            } else {

                position = source.y.map(value => Number(value));
            }
        }

        const labels = time.map(value => Number(value));

        if (!labels.length || !position.length) {
            return null;
        }

        return {
            labels,
            position,
            angle
        };
    }

    function renderPendulumChart(parsed) {

        if (pendulumChart) {
            pendulumChart.destroy();
        }

        const datasets = [
            {
                label: t("pendulum.positionLabel"),
                data: parsed.position,
                borderWidth: 3,
                tension: 0.35
            }
        ];

        if (parsed.angle && parsed.angle.length > 0) {

            datasets.push({
                label: t("pendulum.angleLabel"),
                data: parsed.angle,
                borderWidth: 3,
                tension: 0.35
            });
        }

        pendulumChart = new Chart(chartCanvas, {
            type: "line",

            data: {
                labels: parsed.labels,
                datasets: datasets
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
    function startPendulumAnimation(parsed) {

        animationData = parsed;
        animationIndex = 0;

        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }

        drawPendulumFrame(0);

        animatePendulum();
    }

    function animatePendulum() {

        if (!animationData) {
            return;
        }

        drawPendulumFrame(animationIndex);

        animationIndex++;

        if (animationIndex >= animationData.labels.length) {
            animationIndex = animationData.labels.length - 1;
            return;
        }

        animationFrameId = requestAnimationFrame(() => {

            setTimeout(() => {
                animatePendulum();
            }, 35);

        });
    }

    function drawPendulumFrame(index) {

        const ctx = animationCtx;
        const canvas = animationCanvas;

        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);

        drawBackground(ctx, width, height);

        const position = Number(animationData.position[index] || 0);
        const angle = Number(animationData.angle[index] || 0);

        const centerX = width / 2;
        const trackY = height * 0.68;

        const scale = 420;

        const cartX = centerX + position * scale;

        drawTrack(ctx, width, trackY);
        drawCart(ctx, cartX, trackY);
        drawPendulum(ctx, cartX, trackY, angle);
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

    function drawTrack(ctx, width, y) {

        ctx.save();

        ctx.strokeStyle = "#81A6C6";
        ctx.lineWidth = 6;
        ctx.lineCap = "round";

        ctx.beginPath();
        ctx.moveTo(50, y);
        ctx.lineTo(width - 50, y);
        ctx.stroke();

        ctx.strokeStyle = "rgba(47,47,47,0.16)";
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(70, y + 18);
        ctx.lineTo(width - 70, y + 18);
        ctx.stroke();

        ctx.restore();
    }

    function drawCart(ctx, x, y) {

        const cartWidth = 110;
        const cartHeight = 52;

        const cartX = x - cartWidth / 2;
        const cartY = y - cartHeight;

        ctx.save();

        ctx.fillStyle = "#AACDDC";
        roundRect(ctx, cartX, cartY, cartWidth, cartHeight, 14);
        ctx.fill();

        ctx.strokeStyle = "#81A6C6";
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = "#2f2f2f";

        ctx.beginPath();
        ctx.arc(cartX + 25, y + 4, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(cartX + cartWidth - 25, y + 4, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    function drawPendulum(ctx, cartX, trackY, angle) {

        const pivotX = cartX;
        const pivotY = trackY - 52;

        const length = 150;

        /*
            In Octave output, angle is usually in radians.
            For visualization we draw the rod from the vertical direction.
        */
        const visualAngle = angle * 6;

        const bobX = pivotX + Math.sin(visualAngle) * length;
        const bobY = pivotY - Math.cos(visualAngle) * length;

        ctx.save();

        ctx.strokeStyle = "#D2C4B4";
        ctx.lineWidth = 8;
        ctx.lineCap = "round";

        ctx.beginPath();
        ctx.moveTo(pivotX, pivotY);
        ctx.lineTo(bobX, bobY);
        ctx.stroke();

        ctx.fillStyle = "#81A6C6";

        ctx.beginPath();
        ctx.arc(pivotX, pivotY, 9, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#F3E3D0";
        ctx.strokeStyle = "#D2C4B4";
        ctx.lineWidth = 4;

        ctx.beginPath();
        ctx.arc(bobX, bobY, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }

    function drawTimeLabel(ctx, time, width) {

        ctx.save();

        ctx.fillStyle = "#5f6b7a";
        ctx.font = "18px Consolas";

        ctx.fillText(`t = ${Number(time).toFixed(2)} s`, width - 160, 38);

        ctx.restore();
    }

    function roundRect(ctx, x, y, width, height, radius) {

        ctx.beginPath();

        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);

        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);

        ctx.lineTo(x + width, y + height - radius);

        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);

        ctx.lineTo(x + radius, y + height);

        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);

        ctx.lineTo(x, y + radius);

        ctx.quadraticCurveTo(x, y, x + radius, y);

        ctx.closePath();
    }
    function loadPendulumParamsFromUrl() {

        const params = new URLSearchParams(window.location.search);

        if (params.has("r")) {
            targetInput.value = params.get("r");
        }

        if (params.has("initPozicia")) {
            initialPositionInput.value = params.get("initPozicia");
        }

        if (params.has("initUhol")) {
            initialAngleInput.value = params.get("initUhol");
        }

        if (
            params.has("r") ||
            params.has("initPozicia") ||
            params.has("initUhol")
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
