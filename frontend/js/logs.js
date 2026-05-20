document.addEventListener("DOMContentLoaded", () => {

    const API_TOKEN = "SECRET";

    const refreshBtn = document.getElementById("refreshLogsBtn");
    const tableBody = document.getElementById("logsTableBody");
    const statusEl = document.getElementById("logsStatus");
    const messageEl = document.getElementById("logsMessage");
    const exportCsvBtn = document.getElementById("exportCsvBtn");

    if (refreshBtn) {
        refreshBtn.addEventListener("click", loadLogs);
    }

    if (exportCsvBtn) {
        exportCsvBtn.addEventListener("click", (event) => {
            event.preventDefault();
            exportCsv();
        });
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

    });

    loadLogs();

    async function loadLogs() {

        setStatus(t("common.loading"), "running");

        tableBody.innerHTML = `
            <tr>
                <td colspan="4">
                    <div class="console-loading">
                        <div class="console-spinner"></div>
                        <div>${escapeHtml(t("logs.loading"))}</div>
                    </div>
                </td>
            </tr>
        `;

        try {

            const response = await fetch(
                "/api/logs",
                {
                    method: "GET",

                    headers: {
                        "Authorization": `Bearer ${API_TOKEN}`
                    }
                }
            );

            const data = await response.json();

            const logs = normalizeLogs(data);

            renderLogs(logs);

            setStatus(t("common.success"), "success");

        } catch (error) {

            console.error(error);

            tableBody.innerHTML = `
                <tr>
                    <td colspan="4">
                        <div class="console-error">
                            ${escapeHtml(t("logs.failed"))}
                        </div>
                    </td>
                </tr>
            `;

            setStatus(t("common.error"), "error");
        }
    }

    function normalizeLogs(data) {

        if (Array.isArray(data)) {
            return data;
        }

        if (Array.isArray(data.logs)) {
            return data.logs;
        }

        if (Array.isArray(data.data)) {
            return data.data;
        }

        if (Array.isArray(data.items)) {
            return data.items;
        }

        return [];
    }

    function renderLogs(logs) {
        console.log("LOGS:", logs);

        messageEl.innerHTML = "";

        if (!logs.length) {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="4">
                        <div class="logs-empty">
                            ${escapeHtml(t("logs.empty"))}
                        </div>
                    </td>
                </tr>
            `;

            return;
        }

        tableBody.innerHTML = logs.map((log) => {

            const createdAt =
                log.created_at ||
                log.datetime ||
                log.timestamp ||
                log.date ||
                "-";

            const command =
                log.command ||
                log.request ||
                log.input ||
                "-";

            const success =
                log.success === true ||
                log.status === "success" ||
                log.correct === true ||
                Number(log.success) === 1;

            const error =
                log.error ||
                log.stderr ||
                log.message ||
                "";

            const encodedCommand = encodeURIComponent(command);

            const targetUrl = buildLogTargetUrl(log);

            return `
                <tr
                    class="clickable-log-row"
                    data-target-url="${escapeHtml(targetUrl)}"
                    title="${escapeHtml(t("logs.rowTitle"))}"
                >
                <td>${escapeHtml(createdAt)}</td>
        
                <td>
                    <div
                        class="log-command"
                        title="${escapeHtml(command)}"
                    >
                        ${escapeHtml(command)}
                    </div>
                </td>
        
                <td>
                    <span class="status-badge ${success ? "success" : "error"}">
                        ${success ? t("common.success") : t("common.error")}
                    </span>
                </td>
        
                <td>
                    ${error ? escapeHtml(error) : "-"}
                </td>
            </tr>
        `;

        }).join("");
        attachLogRowClickHandlers();
    }
    function attachLogRowClickHandlers() {

        const rows = document.querySelectorAll(".clickable-log-row");

        rows.forEach((row) => {

            row.addEventListener("click", () => {

                const targetUrl = row.dataset.targetUrl;

                if (!targetUrl) {
                    return;
                }

                window.location.href = targetUrl;

            });

        });
    }
    function buildLogTargetUrl(log) {

        const type = String(log.type || "").toLowerCase();

        const command =
            log.command ||
            log.request ||
            log.input ||
            "";

        if (type === "pendulum") {

            const payload = parseJsonCommand(command);

            return buildSimulationUrl(
                "pendulum.html",
                payload,
                command
            );
        }

        if (
            type === "ball_beam" ||
            type === "ball-beam" ||
            type === "ballbeam"
        ) {

            const payload = parseJsonCommand(command);

            return buildSimulationUrl(
                "ballbeam.html",
                payload,
                command
            );
        }

        return `console.html?command=${encodeURIComponent(command)}`;
    }
    function parseJsonCommand(command) {

        if (!command) {
            return null;
        }

        if (typeof command !== "string") {
            return command;
        }

        try {
            return JSON.parse(command);
        } catch (error) {
            return null;
        }
    }
    function buildSimulationUrl(page, payload, command) {

        const params = new URLSearchParams();

        if (payload && typeof payload === "object") {

            Object.keys(payload).forEach((key) => {

                if (
                    payload[key] !== null &&
                    payload[key] !== undefined
                ) {
                    params.set(key, payload[key]);
                }

            });

        }

        const queryString = params.toString();

        if (!queryString) {
            return page;
        }

        return `${page}?${queryString}`;
    }
    async function exportCsv() {

        try {

            const response = await fetch(
                "/api/logs/export",
                {
                    method: "GET",

                    headers: {
                        "Authorization": `Bearer ${API_TOKEN}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error(t("logs.exportFailed"));
            }

            const blob = await response.blob();

            const url = window.URL.createObjectURL(blob);

            const link = document.createElement("a");

            link.href = url;
            link.download = "cas-request-logs.csv";

            document.body.appendChild(link);

            link.click();

            link.remove();

            window.URL.revokeObjectURL(url);
            showToast(
                "toast.csvSuccess",
                "success"
            );

        } catch (error) {

            console.error(error);

            messageEl.innerHTML = `
                <div class="console-error mb-3">
                    ${escapeHtml(t("logs.exportFailed"))}
                </div>
            `;
            showToast(
                "toast.csvError",
                "error"
            );
        }

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
