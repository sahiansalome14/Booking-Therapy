import React, { createContext, useContext, useCallback } from "react";
import { useTranslation } from "react-i18next";

interface LanguageContextType {
	locale: string;
	setLocale: (lang: string) => void;
	t: (key: string, options?: Record<string, unknown>) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
	const { t, i18n } = useTranslation();

	const setLocale = useCallback(
		(lang: string) => {
			i18n.changeLanguage(lang);
			localStorage.setItem("vis_vitalis_lang", lang);
		},
		[i18n],
	);

	return (
		<LanguageContext.Provider
			value={{ locale: i18n.language, setLocale, t }}
		>
			{children}
		</LanguageContext.Provider>
	);
}

export function useLanguage() {
	const ctx = useContext(LanguageContext);
	if (!ctx)
		throw new Error("useLanguage debe usarse dentro de <LanguageProvider>");
	return ctx;
}
