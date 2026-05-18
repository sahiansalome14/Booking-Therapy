import { Loader2, Mail, MapPin, Search, Star } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { type Therapist, therapistService } from "../../services/therapist";
import { Button } from "../components/Button";
import { Card } from "../components/Card";

export default function TherapistSearch() {
	const { t } = useTranslation();
	const [selectedSpecialty, setSelectedSpecialty] = useState("Todos");
	const [searchQuery, setSearchQuery] = useState("");
	const [therapists, setTherapists] = useState<Therapist[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [specialties, setSpecialties] = useState<string[]>(["Todos"]);

	useEffect(() => {
		const fetchTherapists = async () => {
			try {
				console.log("Fetching therapists...");
				const data = await therapistService.getAll();
				console.log("Therapists received:", data);
				setTherapists(data);

				const uniqueSpecialties = Array.from(
					new Set(data.map((t) => t.specialty)),
				).filter(Boolean);
				setSpecialties(["Todos", ...uniqueSpecialties]);
			} catch (error) {
				console.error("Error fetching therapists:", error);
			} finally {
				setIsLoading(false);
			}
		};
		fetchTherapists();
	}, []);

	const filteredTherapists = therapists.filter((therapist) => {
		const matchesSpecialty =
			selectedSpecialty === "Todos" ||
			therapist.specialty === selectedSpecialty;
		const matchesSearch =
			(therapist.name?.toLowerCase() || "").includes(
				searchQuery.toLowerCase(),
			) ||
			(therapist.specialty?.toLowerCase() || "").includes(
				searchQuery.toLowerCase(),
			);
		return matchesSpecialty && matchesSearch;
	});

	if (isLoading) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<Loader2 className="w-12 h-12 animate-spin text-blue-600" />
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-b from-blue-50/50 to-background py-12">
			<div className="container mx-auto px-6">
				<div className="mb-10">
					<h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
						{t("search.title")}
					</h1>
					<p className="text-muted-foreground text-lg">
						{t("search.subtitle")}
					</p>
				</div>

				<div className="bg-white border border-blue-100 rounded-2xl p-6 mb-10 shadow-lg shadow-blue-500/5">
					<div className="flex flex-col lg:flex-row gap-4">
						<div className="flex-1">
							<div className="relative">
								<Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-400 w-5 h-5" />
								<input
									type="text"
									placeholder={t("search.placeholder")}
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="w-full pl-12 pr-4 py-3 border-2 border-blue-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all duration-200"
								/>
							</div>
						</div>

						<div className="lg:w-64">
							<select
								value={selectedSpecialty}
								onChange={(e) => setSelectedSpecialty(e.target.value)}
								className="w-full px-4 py-3 border-2 border-blue-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all duration-200"
							>
								{specialties.map((specialty) => (
									<option key={specialty} value={specialty}>
										{specialty}
									</option>
								))}
							</select>
						</div>
					</div>
				</div>

				<div className="mb-6">
					<p className="text-muted-foreground font-medium">
						{t("search.found", { count: filteredTherapists.length })}
					</p>
				</div>

				<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
					{filteredTherapists.map((therapist) => (
						<div
							key={therapist.id}
							className="group bg-white border border-blue-100 rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 hover:-translate-y-2"
						>
							<div className="flex flex-col h-full">
								<div className="relative overflow-hidden">
									<img
										src={therapist.image}
										alt={therapist.name}
										className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-500"
									/>
									<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
									<div className="absolute top-4 right-4 bg-white px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
										<Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
										<span className="text-sm font-bold">
											{therapist.rating}
										</span>
									</div>
								</div>

								<div className="flex-1 flex flex-col p-6">
									<h3 className="text-xl font-bold mb-1">{therapist.name}</h3>
									<div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
										<Mail className="w-3.5 h-3.5" />
										<span>{therapist.email}</span>
									</div>
									<p className="text-blue-600 font-medium text-sm mb-3">
										{therapist.specialty}
									</p>
									<p className="text-muted-foreground text-sm mb-4 line-clamp-2 leading-relaxed">
										{therapist.bio}
									</p>

									<div className="flex items-center gap-4 text-sm text-muted-foreground mb-5">
										<span className="font-medium">
											{therapist.reviews || 0} {t("search.reviews")}
										</span>
										<span>•</span>
										<span className="font-bold text-blue-600">
											{therapist.currency || "COP"}{" "}
											{therapist.price?.toLocaleString("es-CO")}{t("search.perSession")}
										</span>
									</div>

									<div className="mt-auto">
										<Link
											to={`/therapist-profile/${therapist.id}`}
											className="block"
										>
											<Button
												variant="outline"
												className="w-full group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600"
											>
												{t("search.viewAvailability")}
											</Button>
										</Link>
									</div>
								</div>
							</div>
						</div>
					))}
				</div>

				{filteredTherapists.length === 0 && (
					<div className="text-center py-12">
						<p className="text-muted-foreground text-lg">
							{t("search.noResults")}
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
