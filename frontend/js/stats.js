document.addEventListener("DOMContentLoaded", () => {

    const API_TOKEN = "SECRET";

    const refreshBtn = document.getElementById("refreshStatsBtn");
    const statusEl = document.getElementById("statsStatus");
    const tableBody = document.getElementById("statsTableBody");
    const messageEl = document.getElementById("statsMessage");

    const pendulumCountEl = document.getElementById("pendulumCount");
    const ballBeamCountEl = document.getElementById("ballBeamCount");

    const chartCanvas = document.getElementById("statsChart");

    let statsChart = null;
    let currentStats = null;

    if (refreshBtn) {
        refreshBtn.addEventListener("click", loadStats);
    }

    window.addEventListener("languagechange", () => {

        if (statusEl.classList.contains("running")) {
            setStatus(t("common.loading"), "running");
        }

        if (statusEl.classList.contains("success")) {
            setStatus(t("common.success"), "success");
        }

        if (statusEl.classList.contains("error")) {
            setStatus(t("common.error"), "error");
        }

        if (currentStats) {
            renderChart(currentStats);
            renderDetails(currentStats.details);
        }

    });

    loadStats();

    async function loadStats() {
        setStatus(t("common.loading"), "running");

        tableBody.innerHTML = `
            <tr>
                <td colspan="4">
                    <div class="console-loading">
                        <div class="console-spinner"></div>
                        <div>${escapeHtml(t("stats.loading"))}</div>
                    </div>
                </td>
            </tr>
        `;

        try {

            const response = await fetch(
                "/api/stats",
                {
                    method: "GET",

                    headers: {
                        "Authorization": `Bearer ${API_TOKEN}`
                    }
                }
            );

            const data = await response.json();

            const normalized = normalizeStats(data);
            currentStats = normalized;

            renderSummary(normalized);
            renderChart(normalized);
            renderDetails(normalized.details);

            setStatus(t("common.success"), "success");

        } catch (error) {

            console.error(error);

            tableBody.innerHTML = `
                <tr>
                    <td colspan="4">
                        <div class="console-error">
                            ${escapeHtml(t("stats.failed"))}
                        </div>
                    </td>
                </tr>
            `;

            setStatus(t("common.error"), "error");
        }
    }

    function normalizeStats(data) {

        const details =
            data.details ||
            data.items ||
            data.logs ||
            data.data ||
            data.usage ||
            [];

        let pendulum = 0;
        let ballBeam = 0;

        /*
            Backend response shape:
            {
                totals: [
                    { animation_type: "ball_beam", total: 2 },
                    { animation_type: "pendulum", total: 4 }
                ],
                details: [...]
            }
        */

        if (Array.isArray(data.totals)) {

            data.totals.forEach((item) => {

                const type = String(
                    item.animation_type ||
                    item.type ||
                    item.animation ||
                    ""
                ).toLowerCase();

                const total = Number(item.total || item.count || 0);

                if (type.includes("pendulum")) {
                    pendulum = total;
                }

                if (
                    type.includes("ball_beam") ||
                    type.includes("ball-beam") ||
                    type.includes("ballbeam") ||
                    type.includes("ball")
                ) {
                    ballBeam = total;
                }

            });

            return {
                pendulum,
                ballBeam,
                details: Array.isArray(details) ? details : []
            };
        }

        /*
            Fallback for other possible response shapes.
        */

        if (Array.isArray(data)) {
            return normalizeFromDetails(data);
        }

        const counts =
            data.counts ||
            data.summary ||
            {};

        pendulum =
            Number(
                counts.pendulum ||
                counts.inverted_pendulum ||
                counts.kyvadlo ||
                0
            );

        ballBeam =
            Number(
                counts.ball_beam ||
                counts.ballBeam ||
                counts.ballbeam ||
                counts.ball ||
                0
            );

        if ((!pendulum && !ballBeam) && Array.isArray(details)) {

            const fromDetails = normalizeFromDetails(details);

            pendulum = fromDetails.pendulum;
            ballBeam = fromDetails.ballBeam;
        }

        return {
            pendulum,
            ballBeam,
            details: Array.isArray(details) ? details : []
        };
    }

    function normalizeFromDetails(details) {

        let pendulum = 0;
        let ballBeam = 0;

        details.forEach((item) => {

            const type = String(
                item.type ||
                item.animation ||
                item.simulation ||
                ""
            ).toLowerCase();

            if (type.includes("pendulum")) {
                pendulum++;
            }

            if (
                type.includes("ball_beam") ||
                type.includes("ball-beam") ||
                type.includes("ballbeam") ||
                type.includes("ball")
            ) {
                ballBeam++;
            }

        });

        return {
            pendulum,
            ballBeam,
            details
        };
    }

    function renderSummary(stats) {

        pendulumCountEl.innerText = stats.pendulum;
        ballBeamCountEl.innerText = stats.ballBeam;
    }

    function renderChart(stats) {

        if (statsChart) {
            statsChart.destroy();
        }

        statsChart = new Chart(chartCanvas, {
            type: "bar",

            data: {
                labels: [
                    t("pendulum.title"),
                    t("ballbeam.title")
                ],

                datasets: [
                    {
                        label: t("stats.runsLabel"),
                        data: [
                            stats.pendulum,
                            stats.ballBeam
                        ],
                        borderWidth: 2
                    }
                ]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,

                plugins: {
                    legend: {
                        display: false
                    }
                },

                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                }
            }
        });
    }

    function renderDetails(details) {

        messageEl.innerHTML = "";

        if (!details || !details.length) {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="4">
                        <div class="logs-empty">
                            ${escapeHtml(t("stats.emptyDetails"))}
                        </div>
                    </td>
                </tr>
            `;

            return;
        }

        tableBody.innerHTML = details.map((item) => {

            const createdAt =
                item.created_at ||
                item.datetime ||
                item.timestamp ||
                item.date ||
                "-";

            const typeRaw =
                item.animation_type ||
                item.type ||
                item.animation ||
                item.simulation ||
                "-";

            const type = String(typeRaw).toLowerCase();

            const isBall =
                type.includes("ball");

            const label =
                isBall
                    ? t("ballbeam.title")
                    : t("pendulum.title");

            const city =
                item.city ||
                item.location_city ||
                "-";

            const country =
                item.country ||
                item.location_country ||
                "-";

            return `
                <tr>
                    <td>${escapeHtml(createdAt)}</td>

                    <td>
                        <span class="animation-type-badge ${isBall ? "ball-beam-badge" : ""}">
                            ${escapeHtml(label)}
                        </span>
                    </td>

                    <td>${escapeHtml(city)}</td>

                    <td>${escapeHtml(country)}</td>
                </tr>
            `;

        }).join("");
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

    function t(key) {
        return window.i18n ? window.i18n.t(key) : key;
    }

});
