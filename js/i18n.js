// i18n.js - Internationalization Module
class I18n {
    constructor() {
        this.translations = {};
        this.supportedLanguages = ['ko', 'en', 'ja', 'zh', 'es', 'pt', 'id', 'tr', 'de', 'fr', 'hi', 'ru'];
        this.currentLang = this.detectLanguage();
        this.initialized = false;
    }

    /**
     * Detect user's preferred language
     * Priority: localStorage > browser language > 'en'
     */
    detectLanguage() {
        // Check localStorage
        const saved = localStorage.getItem('preferred-language');
        if (saved && this.supportedLanguages.includes(saved)) {
            return saved;
        }

        // Check browser language
        const browserLang = navigator.language.split('-')[0].toLowerCase();
        if (this.supportedLanguages.includes(browserLang)) {
            return browserLang;
        }

        // Default to English
        return 'en';
    }

    /**
     * Load translation file for a language
     */
    async loadLocale(lang) {
        if (this.translations[lang]) {
            return this.translations[lang];
        }

        try {
            const response = await fetch(`js/locales/${lang}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load locale: ${lang}`);
            }
            const data = await response.json();
            this.translations[lang] = data;
            return data;
        } catch (error) {
            console.error(`Error loading locale ${lang}:`, error);
            // Fallback to English if available
            if (lang !== 'en' && this.translations['en']) {
                return this.translations['en'];
            }
            return {};
        }
    }

    /**
     * Initialize i18n system
     * Load all supported languages
     */
    async initialize() {
        if (this.initialized) {
            return;
        }

        try {
            // Load current language first
            await this.loadLocale(this.currentLang);

            // Load English as fallback
            if (this.currentLang !== 'en') {
                await this.loadLocale('en');
            }

            // Update DOM with current language
            this.updateDOM();
            this.initialized = true;
        } catch (error) {
            console.error('Failed to initialize i18n:', error);
        }
    }

    /**
     * Get translated text using dot notation
     * Example: t('game.score') -> translations.game.score
     */
    t(key, defaultValue = key) {
        const keys = key.split('.');
        let value = this.translations[this.currentLang];

        for (const k of keys) {
            value = value?.[k];
            if (!value) {
                // Fallback to English
                let fallback = this.translations['en'];
                for (const fk of keys) {
                    fallback = fallback?.[fk];
                    if (!fallback) break;
                }
                return fallback || defaultValue;
            }
        }

        return value || defaultValue;
    }

    /**
     * Get language name in its native script
     */
    getLanguageName(lang) {
        const names = {
            'ko': '한국어',
            'en': 'English',
            'ja': '日本語',
            'zh': '中文',
            'es': 'Español',
            'pt': 'Português',
            'id': 'Bahasa Indonesia',
            'tr': 'Türkçe',
            'de': 'Deutsch',
            'fr': 'Français',
            'hi': 'हिन्दी',
            'ru': 'Русский'
        };
        return names[lang] || lang;
    }

    /**
     * Set current language and update UI
     */
    async setLanguage(lang) {
        if (!this.supportedLanguages.includes(lang)) {
            console.warn(`Unsupported language: ${lang}`);
            return;
        }

        this.currentLang = lang;
        localStorage.setItem('preferred-language', lang);

        // Load translations for new language
        await this.loadLocale(lang);

        // Update all DOM elements
        this.updateDOM();

        // Dispatch event for external listeners
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
    }

    /**
     * Update all elements with data-i18n attribute
     */
    updateDOM() {
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            const translation = this.t(key);

            // For different element types
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                if (el.type === 'placeholder' || el.hasAttribute('placeholder')) {
                    el.placeholder = translation;
                } else {
                    el.value = translation;
                }
            } else {
                el.textContent = translation;
            }
        });
    }

    /**
     * Get current language
     */
    getCurrentLanguage() {
        return this.currentLang;
    }

    /**
     * Get all supported languages
     */
    getSupportedLanguages() {
        return this.supportedLanguages;
    }

    /**
     * Format number based on locale
     */
    formatNumber(num, lang = this.currentLang) {
        try {
            return new Intl.NumberFormat(lang).format(num);
        } catch {
            return num.toString();
        }
    }

    /**
     * Format date based on locale
     */
    formatDate(date, lang = this.currentLang) {
        try {
            const d = date instanceof Date ? date : new Date(date);
            return new Intl.DateTimeFormat(lang).format(d);
        } catch {
            return date.toString();
        }
    }
}

// Create global i18n instance
const i18n = new I18n();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        i18n.initialize().catch(err => console.error('i18n initialization error:', err));
    });
} else {
    i18n.initialize().catch(err => console.error('i18n initialization error:', err));
}
