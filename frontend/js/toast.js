window.showToast = function (
    message,
    type = "info"
) {

    let container =
        document.getElementById("toastContainer");

    if (!container) {

        container =
            document.createElement("div");

        container.id =
            "toastContainer";

        container.className =
            "toast-container-custom";

        document.body.appendChild(container);
    }

    const toast =
        document.createElement("div");

    toast.className =
        `custom-toast ${type}`;

    const translatedMessage =
        window.i18n
            ? window.i18n.t(message)
            : message;

    let icon = "i";

    if (type === "success") {
        icon = "✓";
    }

    if (type === "error") {
        icon = "!";
    }

    toast.innerHTML = `
        <div class="toast-icon">
            ${icon}
        </div>

        <div class="toast-message">
            ${escapeHtml(translatedMessage)}
        </div>
    `;

    container.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add("show");
    });

    setTimeout(() => {

        toast.classList.remove("show");

        setTimeout(() => {
            toast.remove();
        }, 300);

    }, 3200);
};

function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
