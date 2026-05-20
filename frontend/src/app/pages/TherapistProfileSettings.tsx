import {
	Briefcase,
	Camera,
	Clock,
	DollarSign,
	Loader2,
	Mail,
	MapPin,
	Save,
	User,
} from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { type Therapist, therapistService } from "../../services/therapist";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { toast } from "../components/Toast";

export default function TherapistProfileSettings() {
	const { t } = useTranslation();
	const [profile, setProfile] = useState<Partial<Therapist>>({
		name: "",
		bio: "",
		specialty: "",
		session_price: 50,
		experience_years: 0,
		avatar_url: "",
		location: "",
	});
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [message, setMessage] = useState({ type: "", text: "" });

	useEffect(() => {
		const fetchProfile = async () => {
			try {
				const data = await therapistService.getOwnProfile();
				setProfile(data);
			} catch (error) {
				console.error("Error fetching profile:", error);
			} finally {
				setIsLoading(false);
			}
		};
		fetchProfile();
	}, []);

	const handleInputChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		const { name, value } = e.target;
		const isNumeric = name === "session_price" || name === "experience_years";
		setProfile((prev) => ({
			...prev,
			[name]: isNumeric ? parseFloat(value) : value,
		}));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSaving(true);
		setMessage({ type: "", text: "" });
		try {
			await therapistService.updateProfile(profile);
			toast.success(t("profileSettings.success"));
		} catch (error) {
			console.error("Error updating profile:", error);
			toast.error(t("profileSettings.error"));
		} finally {
			setIsSaving(false);
		}
	};

	if (isLoading) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<Loader2 className="w-12 h-12 animate-spin text-blue-600" />
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background py-8">
			<div className="container mx-auto px-6 max-w-4xl">
				<div className="mb-8">
					<h1 className="text-3xl font-bold mb-2">⚙️ {t("profileSettings.title")}</h1>
					<p className="text-muted-foreground">
						{t("profileSettings.subtitle")}
					</p>
				</div>

				{message.text && (
					<div
						className={`mb-6 p-4 rounded-xl border ${
							message.type === "success"
								? "bg-green-50 border-green-200 text-green-700"
								: "bg-red-50 border-red-200 text-red-700"
						}`}
					>
						{message.text}
					</div>
				)}

				<form onSubmit={handleSubmit} className="space-y-6">
					<Card>
						<div className="p-4 border-b border-border mb-6">
							<h2 className="text-xl font-semibold flex items-center gap-2">
								<User className="w-5 h-5 text-blue-600" />
								👤 {t("profileSettings.basicInfo")}
							</h2>
						</div>

						<div className="grid md:grid-cols-2 gap-6">
							<div className="md:col-span-2 flex items-center gap-6 mb-4">
								<div className="relative">
									<img
										src={
											(profile as any).avatar_url ||
											(profile as any).image ||
											"https://api.dicebear.com/7.x/avataaars/svg?seed=default"
										}
										alt="Profile"
										className="w-24 h-24 rounded-full object-cover border-2 border-blue-100"
									/>
									<button
										type="button"
										className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors"
									>
										<Camera className="w-4 h-4" />
									</button>
								</div>
								<div className="flex-1">
									<label className="block text-sm font-medium mb-1">
										{t("profileSettings.avatarUrl")}
									</label>
									<input
										type="text"
										name="avatar_url"
										value={(profile as any).avatar_url || ""}
										onChange={handleInputChange}
										className="w-full px-4 py-2 border border-border rounded-lg bg-input-background"
										placeholder={t("profileSettings.avatarUrlPlaceholder")}
									/>
								</div>
							</div>

							<div>
								<label className="block text-sm font-medium mb-1 text-muted-foreground uppercase tracking-wider text-[10px]">
									{t("profileSettings.fullName")}
								</label>
								<div className="relative">
									<User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
									<input
										type="text"
										name="name"
										value={profile.name || ""}
										readOnly
										className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg bg-muted/30 cursor-not-allowed"
									/>
								</div>
							</div>

							<div>
								<label className="block text-sm font-medium mb-1 text-muted-foreground uppercase tracking-wider text-[10px]">
									{t("profileSettings.specialty")}
								</label>
								<div className="relative">
									<Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
									<input
										type="text"
										name="specialty"
										value={profile.specialty || ""}
										onChange={handleInputChange}
										className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg bg-input-background"
										placeholder={t("profileSettings.specialtyPlaceholder")}
									/>
								</div>
							</div>

							<div>
								<label className="block text-sm font-medium mb-1 text-muted-foreground uppercase tracking-wider text-[10px]">
									{t("profileSettings.sessionPrice")}
								</label>
								<div className="relative">
									<DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
									<input
										type="number"
										name="session_price"
										value={(profile as any).session_price || 50000}
										onChange={handleInputChange}
										className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg bg-input-background"
									/>
								</div>
							</div>

							<div>
								<label className="block text-sm font-medium mb-1 text-muted-foreground uppercase tracking-wider text-[10px]">
									{t("profileSettings.location")}
								</label>
								<div className="relative">
									<MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
									<input
										type="text"
										name="location"
										value={profile.location || ""}
										onChange={handleInputChange}
										className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg bg-input-background"
										placeholder={t("profileSettings.locationPlaceholder")}
									/>
								</div>
							</div>

							<div>
								<label className="block text-sm font-medium mb-1 text-muted-foreground uppercase tracking-wider text-[10px]">
									{t("profileSettings.experienceYears")}
								</label>
								<div className="relative">
									<Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
									<input
										type="number"
										name="experience_years"
										value={profile.experience_years || 0}
										onChange={handleInputChange}
										className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg bg-input-background"
									/>
								</div>
							</div>

							<div className="md:col-span-2">
								<label className="block text-sm font-medium mb-1 text-muted-foreground uppercase tracking-wider text-[10px]">
									{t("profileSettings.bio")}
								</label>
								<textarea
									name="bio"
									value={profile.bio || ""}
									onChange={handleInputChange}
									rows={4}
									className="w-full px-4 py-2.5 border border-border rounded-lg bg-input-background resize-none"
									placeholder={t("profileSettings.bioPlaceholder")}
								/>
							</div>
						</div>
					</Card>

					<div className="flex justify-end">
						<Button type="submit" disabled={isSaving} className="min-w-[150px]">
							{isSaving ? (
								<>
									<Loader2 className="w-4 h-4 mr-2 animate-spin" />
									{t("profileSettings.saving")}
								</>
							) : (
								<>
									<Save className="w-4 h-4 mr-2" />
									{t("profileSettings.saveChanges")}
								</>
							)}
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
}
