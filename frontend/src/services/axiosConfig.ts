import axios from "axios";
import i18n from "../i18n";

// Interceptor global que inyecta el header Accept-Language
// en cada solicitud HTTP basándose en el idioma activo de i18next
axios.interceptors.request.use((config) => {
	config.headers["Accept-Language"] = i18n.language || "es";
	return config;
});
