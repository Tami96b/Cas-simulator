(function () {

    const defaultLanguage = "en";
    const storageKey = "casSimulatorLanguage";

    function getSavedLanguage() {

        const savedLanguage = localStorage.getItem(storageKey);

        if (window.translations && window.translations[savedLanguage]) {
            return savedLanguage;
        }

        return defaultLanguage;
    }

    function t(key) {

        const language = getCurrentLanguage();
        const dictionary = window.translations[language] || window.translations[defaultLanguage];

        return dictionary[key] || window.translations[defaultLanguage][key] || key;
    }

    function getCurrentLanguage() {
        return document.documentElement.lang || getSavedLanguage();
    }

    function applyTranslations(language = getSavedLanguage()) {

        document.documentElement.lang = language;
        localStorage.setItem(storageKey, language);

        document.querySelectorAll("[data-i18n]").forEach((element) => {
            element.textContent = t(element.dataset.i18n);
        });

        document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
            element.setAttribute("placeholder", t(element.dataset.i18nPlaceholder));
        });

        document.querySelectorAll("[data-i18n-title]").forEach((element) => {
            element.textContent = t(element.dataset.i18nTitle);
        });

        document.querySelectorAll(".language-button").forEach((button) => {
            button.classList.toggle("active", button.dataset.lang === language);
        });

        const languageSwitcher = document.getElementById("languageSwitcher");

        if (languageSwitcher) {
            languageSwitcher.value = language;
        }

        window.dispatchEvent(new CustomEvent("languagechange", {
            detail: { language }
        }));
    }

    window.i18n = {
        t,
        applyTranslations,
        getCurrentLanguage
    };

    document.addEventListener("DOMContentLoaded", () => {

        document.querySelectorAll(".language-button").forEach((button) => {

            button.addEventListener("click", () => {
                applyTranslations(button.dataset.lang);
            });

        });

        const languageSwitcher = document.getElementById("languageSwitcher");

        if (languageSwitcher) {
            languageSwitcher.addEventListener("change", () => {
                applyTranslations(languageSwitcher.value);
            });
        }

        applyTranslations();
    });

})();
