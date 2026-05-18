import { RouterProvider } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";
import { router } from "./routes";

function AppRouter() {
	const { isInitializing } = useAuth();
	const { t } = useTranslation();

	if (isInitializing) {
		return (
			<div className="flex h-screen items-center justify-center bg-background">
				<div className="animate-pulse space-y-4 flex flex-col items-center">
					<div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
					<p className="text-muted-foreground font-medium">
						{t("common.loadingSession")}
					</p>
				</div>
			</div>
		);
	}

	return <RouterProvider router={router} />;
}

export default function App() {
	return (
		<LanguageProvider>
			<AuthProvider>
				<AppRouter />
			</AuthProvider>
		</LanguageProvider>
	);
}
