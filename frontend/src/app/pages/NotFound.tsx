import { Home, Search } from "lucide-react";
import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "../components/Button";

export default function NotFound() {
	const { t } = useTranslation();

	return (
		<div className="min-h-screen bg-background flex items-center justify-center p-6">
			<div className="text-center max-w-md">
				<div className="mb-8">
					<h1 className="text-9xl font-bold text-primary mb-4">404</h1>
					<h2 className="text-2xl font-bold mb-2">{t("notFound.title")}</h2>
					<p className="text-muted-foreground">
						{t("notFound.subtitle")}
					</p>
				</div>

				<div className="flex gap-4 justify-center">
					<Link to="/">
						<Button>
							<Home className="w-4 h-4 mr-2" />
							{t("notFound.home")}
						</Button>
					</Link>
					<Link to="/search">
						<Button variant="outline">
							<Search className="w-4 h-4 mr-2" />
							{t("nav.searchTherapists")}
						</Button>
					</Link>
				</div>
			</div>
		</div>
	);
}
