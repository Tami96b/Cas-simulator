document.addEventListener("DOMContentLoaded", () => {

    const API_TOKEN = "SECRET";

    const executeBtn = document.getElementById("executeBtn");
    const clearBtn = document.getElementById("clearBtn");
    const commandInput = document.getElementById("commandInput");
    const output = document.getElementById("output");
    const exampleButtons = document.querySelectorAll(".quick-example-btn");
    loadCommandFromUrl();

    if (executeBtn) {
        executeBtn.addEventListener("click", executeCommand);
    }

    if (clearBtn) {
        clearBtn.addEventListener("click", clearOutput);
    }

    window.addEventListener("languagechange", () => {

        if (executeBtn && !executeBtn.disabled) {
            executeBtn.innerText = t("console.execute");
        }

    });

    exampleButtons.forEach((button) => {

        button.addEventListener("click", () => {

            const command = button.dataset.command;

            if (commandInput) {
                commandInput.value = command;
                commandInput.focus();
            }

        });

    });

    function loadCommandFromUrl() {

        const params = new URLSearchParams(window.location.search);

        const command = params.get("command");

        if (!command || !commandInput) {
            return;
        }

        commandInput.value = command;

            output.innerHTML = `
        <div class="console-info">
            <div class="console-label">
                INFO
            </div>

            <div>
                ${escapeHtml(t("console.loadedFromLog"))}
            </div>
        </div>
    `;
    }

    async function executeCommand() {

        const command = commandInput.value.trim();

        if (!command) {

            output.innerHTML = `
                <div class="console-error">
                    ${escapeHtml(t("console.emptyCommand"))}
                </div>
            `;

            return;
        }

        setLoading(true);

        try {

            const response = await fetch(
                "/api/eval",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${API_TOKEN}`
                    },

                    body: JSON.stringify({
                        command: command,
                        session_id: "anon"
                    })
                }
            );

            const data = await response.json();

            renderOutput(data);

        } catch (error) {

            output.innerHTML = `
                <div class="console-error">
                    ${escapeHtml(t("console.networkError"))}
                </div>
            `;

            console.error(error);

        } finally {

            setLoading(false);
        }
    }

    function renderOutput(data) {

        if (data.success) {

            const cleanStderr = cleanOctaveWarnings(data.stderr || "");

            let html = "";

            if (data.stdout) {

                html += `
                    <div class="console-success">
                        <div class="console-result">${escapeHtml(data.stdout)}</div>
                    </div>
                `;
            }

            if (cleanStderr) {

                html += `
                    <div class="console-info">

                        <div class="console-label">
                            INFO
                        </div>

                        <div>${escapeHtml(cleanStderr)}</div>

                    </div>
                `;
            }

            output.innerHTML = html || `
                <div class="console-info">
                    ${escapeHtml(t("console.noOutput"))}
                </div>
            `;

            return;
        }

        output.innerHTML = `
            <div class="console-error">
                ${escapeHtml(data.error || t("console.executionFailed"))}
            </div>
        `;
    }

    function setLoading(isLoading) {

        if (isLoading) {

            executeBtn.disabled = true;
            executeBtn.innerText = t("console.executing");

            output.innerHTML = `
                <div class="console-loading">
                    <div class="console-spinner"></div>
                    <div>${escapeHtml(t("console.executingCommand"))}</div>
                </div>
            `;

            return;
        }

        executeBtn.disabled = false;
        executeBtn.innerText = t("console.execute");
    }

    function clearOutput() {

        output.innerHTML = escapeHtml(t("console.waiting"));
    }

    function cleanOctaveWarnings(stderr) {

        return stderr
            .split("\n")
            .filter((line) => {
                return !line.includes("X11 DISPLAY environment variable not set")
                    && !line.includes("disabling GUI features");
            })
            .join("\n")
            .trim();
    }

    function escapeHtml(value) {

        return value
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
