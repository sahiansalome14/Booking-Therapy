import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import es from "./app/data/locales/es.json";
import en from "./app/data/locales/en.json";

// Idioma guardado en localStorage o español por defecto
const savedLang = localStorage.getItem("vis_vitalis_lang") || "es";

i18n.use(initReactI18next).init({
	resources: {
		es: { translation: es },
		en: { translation: en },
	},
	lng: savedLang,
	fallbackLng: "es",
	interpolation: {
		escapeValue: false,
	},
});

export default i18n;
