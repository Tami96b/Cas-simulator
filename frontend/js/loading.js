window.showLoadingOverlay = function (
    message = "Loading..."
) {

    const translatedMessage =
        window.i18n
            ? window.i18n.t(message)
            : message;

    let overlay =
        document.getElementById("globalLoadingOverlay");

    if (!overlay) {

        overlay =
            document.createElement("div");

        overlay.id =
            "globalLoadingOverlay";

        overlay.innerHTML = `
            <div class="loading-overlay-backdrop">

                <div class="loading-overlay-card">

                    <div class="loading-spinner"></div>

                    <div
                        id="loadingOverlayMessage"
                        class="loading-overlay-message"
                    >
                        ${escapeHtml(translatedMessage)}
                    </div>

                </div>

            </div>
        `;

        document.body.appendChild(overlay);

        requestAnimationFrame(() => {
            overlay.classList.add("show");
        });

        return;
    }

    const messageEl =
        document.getElementById("loadingOverlayMessage");

    if (messageEl) {
        messageEl.innerText = translatedMessage;
    }

    overlay.classList.add("show");
};

window.hideLoadingOverlay = function () {

    const overlay =
        document.getElementById("globalLoadingOverlay");

    if (!overlay) {
        return;
    }

    overlay.classList.remove("show");
};

function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
