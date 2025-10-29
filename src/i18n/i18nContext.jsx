import { createContext, useContext, useState, useEffect } from 'react';
import enUS from './locales/en-US.js';
import ptBR from './locales/pt-BR.js';

const I18nContext = createContext();

const translations = {
    'en-US': enUS,
    'pt-BR': ptBR
};

export function I18nProvider({ children }) {
    const [locale, setLocale] = useState('en-US');

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await fetch('http://localhost:3000/api/settings');
                if (response.ok) {
                    const settings = await response.json();
                    setLocale(settings.general.language || 'en-US');
                }
            } catch (error) {
                console.error('Error fetching language settings:', error);
            }
        };

        fetchSettings();
    }, []);

    const t = (key, params = {}) => {
        const keys = key.split('.');
        let value = translations[locale];

        for (const k of keys) {
            if (value && typeof value === 'object')
                value = value[k];
            else {
                console.warn(`Translation key not found: ${key} for locale ${locale}`);
                return key;
            }
        }

        if (typeof value === 'string') {
            return value.replace(/\{(\w+)\}/g, (match, param) => {
                return params[param] || match;
            });
        }

        return value || key;
    };

    const changeLocale = (newLocale) => {
        setLocale(newLocale);
    };

    return (
        <I18nContext.Provider value={{ locale, changeLocale, t }}>
            {children}
        </I18nContext.Provider>
    );
}

export function useI18n() {
    const context = useContext(I18nContext);

    if (!context)
        throw new Error('useI18n must be used within an I18nProvider');

    return context;
}