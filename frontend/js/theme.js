(function () {

    const storageKey = "casSimulatorTheme";
    const darkTheme = "dark";
    const lightTheme = "light";

    function getSavedTheme() {

        const savedTheme = localStorage.getItem(storageKey);

        if (savedTheme === darkTheme || savedTheme === lightTheme) {
            return savedTheme;
        }

        return lightTheme;
    }

    function applyTheme(theme) {

        document.body.classList.toggle("dark-theme", theme === darkTheme);
        localStorage.setItem(storageKey, theme);
        updateToggle(theme);
    }

    function toggleTheme() {

        const nextTheme =
            document.body.classList.contains("dark-theme")
                ? lightTheme
                : darkTheme;

        applyTheme(nextTheme);
    }

    function t(key) {
        return window.i18n ? window.i18n.t(key) : key;
    }

    function updateToggle(theme = getSavedTheme()) {

        const button = document.getElementById("themeToggle");

        if (!button) {
            return;
        }

        const isDark = theme === darkTheme;

        button.innerText = isDark
            ? t("common.lightMode")
            : t("common.darkMode");

        button.setAttribute(
            "aria-label",
            `${t("common.theme")}: ${button.innerText}`
        );
    }

    function mountToggle() {

        const navList = document.querySelector(".navbar-nav");

        if (!navList || document.getElementById("themeToggle")) {
            return;
        }

        const item = document.createElement("li");
        item.className = "nav-item";

        const button = document.createElement("button");
        button.id = "themeToggle";
        button.className = "theme-toggle";
        button.type = "button";
        button.addEventListener("click", toggleTheme);

        item.appendChild(button);
        navList.appendChild(item);
    }

    document.addEventListener("DOMContentLoaded", () => {
        mountToggle();
        applyTheme(getSavedTheme());
    });

    window.addEventListener("languagechange", () => {
        updateToggle();
    });

})();
