import {
	Calendar as CalendarIcon,
	CheckCircle2,
	Clock,
	Loader2,
	Lock,
	Plus,
	Settings,
	ShieldAlert,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "../components/Toast";
import {
	type Availability,
	agendaService,
	type Block,
	type Slot,
} from "../../services/agenda";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "../components/ui/tabs";
import { useAuth } from "../context/AuthContext";

const MINUTES_BEFORE_LOCK = 15;

export default function TherapistSchedule() {
	const { user } = useAuth();
	const { t, i18n } = useTranslation();
	const [activeTab, setActiveTab] = useState("agenda");
	const [selectedDate, setSelectedDate] = useState(
		new Date().toISOString().split("T")[0],
	);
	const [slots, setSlots] = useState<Slot[]>([]);
	const [availabilities, setAvailabilities] = useState<Availability[]>([]);
	const [blocks, setBlocks] = useState<Block[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	// Form states for adding blocks/availability
	const [isAddingBlock, setIsAddingBlock] = useState(false);
	const [newBlock, setNewBlock] = useState({
		start_datetime: "",
		end_datetime: "",
		reason: "",
	});

	const [editingAvail, setEditingAvail] = useState<{
		day: number;
		start: string;
		end: string;
	} | null>(null);

	const fetchAgendaData = useCallback(async () => {
		if (!user?.id) return;
		setIsLoading(true);
		try {
			const [slotsData, availData, blocksData] = await Promise.all([
				agendaService.getSlots(user.id, selectedDate),
				agendaService.getAvailability(user.id),
				agendaService.getBlocks(user.id),
			]);
			setSlots(slotsData);
			setAvailabilities(availData);
			setBlocks(blocksData);
		} catch (error) {
			console.error("Error fetching agenda data:", error);
		} finally {
			setIsLoading(false);
		}
	}, [user?.id, selectedDate]);

	useEffect(() => {
		fetchAgendaData();
	}, [fetchAgendaData]);

	const handleSetAvailability = async (newAvail: Availability[]) => {
		try {
			await agendaService.setAvailability(newAvail);
			fetchAgendaData();
			toast.success(t("schedule.availabilityUpdated"));
		} catch (error) {
			toast.error(t("schedule.availabilityUpdateError"));
		}
	};

	const handleCreateBlock = async (blockData: Block) => {
		try {
			await agendaService.createBlock(blockData);
			setIsAddingBlock(false);
			setNewBlock({ start_datetime: "", end_datetime: "", reason: "" });
			fetchAgendaData();
			toast.success(t("schedule.blockCreated"));
		} catch (error) {
			toast.error(t("schedule.blockCreateError"));
		}
	};

	const handleSaveDayAvailability = async () => {
		if (!editingAvail) return;

		// Create new list: replace or add the edited day
		const otherDays = availabilities.filter((a) => a.day !== editingAvail.day);
		const updatedList = [...otherDays, editingAvail].sort(
			(a, b) => a.day - b.day,
		);

		try {
			await agendaService.setAvailability(updatedList);
			setEditingAvail(null);
			fetchAgendaData();
			toast.success(t("schedule.availabilityUpdated"));
		} catch (error) {
			toast.error(t("schedule.saveAvailabilityError"));
		}
	};

	const handleDeleteBlock = async (blockId: string) => {
		if (!blockId) return;
		if (!confirm(t("schedule.confirmDeleteBlock"))) return;

		try {
			await agendaService.deleteBlock(blockId);
			fetchAgendaData();
			toast.success(t("schedule.blockDeleted"));
		} catch (error) {
			toast.error(t("schedule.blockDeleteError"));
		}
	};

	const handleBlockSlot = async (slot: Slot) => {
		if (!confirm(t("schedule.confirmBlockSlot", { time: slot.start }))) return;
		try {
			await agendaService.createBlock({
				start_datetime: slot.start_datetime,
				end_datetime: slot.end_datetime,
				reason: t("schedule.manualBlock"),
			});
			fetchAgendaData();
		} catch (error) {
			toast.error(t("schedule.blockSlotError"));
		}
	};

	const getDayName = (dayIdx: number) => {
		const daysEs = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
		const daysEn = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
		return i18n.language === "es" ? daysEs[dayIdx] : daysEn[dayIdx];
	};

	return (
		<div className="min-h-screen bg-background py-8">
			<div className="container mx-auto px-4 sm:px-6">
				<header className="mb-8">
					<h1 className="text-3xl font-bold">🗓️ {t("schedule.title")}</h1>
					<p className="text-muted-foreground text-base sm:text-lg mt-1">
						{t("schedule.subtitle")}
					</p>
				</header>

				<div className="grid lg:grid-cols-12 gap-8">
					<div className="lg:col-span-12">
						<div className="bg-card rounded-3xl border shadow-sm overflow-hidden p-1 sm:p-2">
							<div className="flex flex-col sm:flex-row bg-muted/50 p-1.5 rounded-2xl mb-6 gap-1.5 sm:gap-0">
								{["agenda", "availability", "blocks"].map((tab) => (
									<button
										key={tab}
										onClick={() => setActiveTab(tab)}
										className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
											activeTab === tab
												? "bg-white shadow-sm text-primary scale-[1.01]"
												: "text-muted-foreground hover:text-foreground hover:bg-white/50"
										}`}
									>
										{tab === "agenda" && (
											<span className="flex items-center justify-center gap-2">
												<CalendarIcon className="w-4 h-4" /> {t("schedule.tabAgenda")}
											</span>
										)}
										{tab === "availability" && (
											<span className="flex items-center justify-center gap-2">
												<Clock className="w-4 h-4" /> {t("schedule.tabMySchedule")}
											</span>
										)}
										{tab === "blocks" && (
											<span className="flex items-center justify-center gap-2">
												<ShieldAlert className="w-4 h-4" /> {t("schedule.tabBlocks")}
											</span>
										)}
									</button>
								))}
							</div>

							<div className="p-4 sm:p-6">
								{activeTab === "agenda" && (
									<div className="space-y-6">
										<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 mb-2">
											<h2 className="text-xl font-bold flex items-center gap-2">
												<CalendarIcon className="w-5 h-5 text-primary" /> {t("schedule.viewSlots")}
											</h2>
											<input
												type="date"
												value={selectedDate}
												onChange={(e) => setSelectedDate(e.target.value)}
												className="w-full sm:w-auto p-2 border rounded-xl bg-background text-sm font-medium shadow-sm focus:ring-2 focus:ring-primary/20"
											/>
										</div>

										{isLoading ? (
											<div className="flex justify-center py-20">
												<Loader2 className="w-10 h-10 animate-spin text-primary" />
											</div>
										) : (
											<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
												{slots.length > 0 ? (
													slots.map((slot, idx) => {
														const slotDate = new Date(slot.start_datetime);
														const now = new Date();
														const isExpired =
															slotDate.getTime() - MINUTES_BEFORE_LOCK * 60000 <
															now.getTime();

														return (
															<div
																key={idx}
																className={`p-4 border rounded-2xl flex flex-col items-center transition-all relative group ${
																	isExpired
																		? "bg-muted/50 border-border opacity-70 cursor-not-allowed"
																		: "bg-primary/5 border-primary/10 hover:bg-primary/10 cursor-default shadow-sm"
																}`}
															>
																{!isExpired && (
																	<button
																		onClick={(e) => {
																			e.stopPropagation();
																			handleBlockSlot(slot);
																		}}
																		className="absolute top-2 right-2 p-1.5 rounded-lg bg-white border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-600 hover:border-red-100"
																		title={t("schedule.newBlock")}
																	>
																		<Lock className="w-3.5 h-3.5" />
																	</button>
																)}

																<div
																	className={`text-lg font-bold ${isExpired ? "text-muted-foreground" : "text-primary"}`}
																>
																	{slot.start}
																</div>
																<div className="text-xs text-muted-foreground text-center mt-0.5">
																	{t("booking.sessionWith", { name: "" }).replace("Sesión con ", "").replace("Session with ", "")} 45m
																</div>

																{isExpired ? (
																	<Badge
																		variant="default"
																		className="mt-3 text-[10px] bg-muted-foreground/10 text-muted-foreground font-semibold"
																	>
																		{t("schedule.expired")}
																	</Badge>
																) : (
																	<Badge
																		variant="default"
																		className="mt-3 text-[10px] bg-white text-primary border border-primary/20 shadow-xs font-bold"
																	>
																		{t("schedule.available")}
																	</Badge>
																)}
															</div>
														);
													})
												) : (
													<div className="col-span-full py-16 sm:py-20 text-center bg-muted/20 rounded-3xl border border-dashed border-border px-4 leading-relaxed">
														<CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
														<p className="text-muted-foreground text-base sm:text-lg font-medium">
															{t("schedule.noSlots", { date: selectedDate })}
														</p>
														<p className="text-xs sm:text-sm text-muted-foreground mt-1">
															{t("schedule.noSlotsDesc")}
														</p>
													</div>
												)}
											</div>
										)}
									</div>
								)}

								{activeTab === "availability" && (
									<div className="space-y-6">
										<h2 className="text-xl font-bold flex items-center gap-2">
											<Clock className="w-5 h-5 text-primary" /> {t("schedule.weeklySchedule")}
										</h2>

										{editingAvail && (
											<Card className="p-4 sm:p-6 border-primary bg-primary/5 shadow-md rounded-2xl sm:rounded-3xl">
												<h3 className="font-bold mb-4 text-primary text-lg">
													{t("schedule.editing")}: {getDayName(editingAvail.day)}
												</h3>
												<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
													<div className="space-y-2">
														<Label className="font-bold">{t("schedule.startTime")}</Label>
														<Input
															type="time"
															value={editingAvail.start}
															className="bg-white"
															onChange={(e) =>
																setEditingAvail({
																	...editingAvail,
																	start: e.target.value,
																})
															}
														/>
													</div>
													<div className="space-y-2">
														<Label className="font-bold">{t("schedule.endTime")}</Label>
														<Input
															type="time"
															value={editingAvail.end}
															className="bg-white"
															onChange={(e) =>
																setEditingAvail({
																	...editingAvail,
																	end: e.target.value,
																})
															}
														/>
													</div>
												</div>
												<div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
													<Button
														variant="ghost"
														className="w-full sm:w-auto justify-center"
														onClick={() => setEditingAvail(null)}
													>
														{t("booking.back")}
													</Button>
													<Button className="w-full sm:w-auto justify-center shadow-md font-bold" onClick={handleSaveDayAvailability}>
														{t("profileSettings.saveChanges")}
													</Button>
												</div>
											</Card>
										)}

										<div className="grid gap-3 sm:gap-4">
											{[0, 1, 2, 3, 4, 5, 6].map((idx) => {
												const avail = availabilities.find((a) => a.day === idx);
												return (
													<div
														key={idx}
														className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-2xl bg-muted/10 hover:bg-muted/20 transition-all gap-3 sm:gap-0 shadow-xs"
													>
														<span className="font-bold text-base sm:text-lg">{getDayName(idx)}</span>
														<div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t border-border/50 sm:border-none pt-3 sm:pt-0">
															<span className="text-muted-foreground text-sm sm:text-base font-medium">
																{avail
																	? `${avail.start.substring(0, 5)} - ${avail.end.substring(0, 5)}`
																	: t("schedule.noSchedule")}
															</span>
															<Button
																variant="outline"
																size="sm"
																className="rounded-xl font-bold hover:bg-primary hover:text-white transition-colors"
																onClick={() =>
																	setEditingAvail({
																		day: idx,
																		start:
																			avail?.start.substring(0, 5) || "09:00",
																		end: avail?.end.substring(0, 5) || "17:00",
																	})
																}
															>
																{t("schedule.edit")}
															</Button>
														</div>
													</div>
												);
											})}
										</div>
									</div>
								)}

								{activeTab === "blocks" && (
									<div className="space-y-6">
										<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
											<h2 className="text-xl font-bold flex items-center gap-2">
												<ShieldAlert className="w-5 h-5 text-primary" />{" "}
												{t("schedule.activeBlocks")}
											</h2>
											<Button
												className="w-full sm:w-auto rounded-xl shadow-md font-bold justify-center"
												onClick={() => setIsAddingBlock(true)}
											>
												<Plus className="w-4 h-4 mr-2" /> {t("schedule.newBlock")}
											</Button>
										</div>

										{isAddingBlock && (
											<Card className="p-4 sm:p-6 border-primary/20 bg-primary/5 shadow-md rounded-2xl sm:rounded-3xl">
												<div className="grid gap-4 sm:gap-6">
													<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
														<div className="space-y-2">
															<Label className="font-bold">{t("schedule.start")}</Label>
															<Input
																type="datetime-local"
																className="bg-white"
																value={newBlock.start_datetime}
																onChange={(e) =>
																	setNewBlock({
																		...newBlock,
																		start_datetime: e.target.value,
																	})
																}
															/>
														</div>
														<div className="space-y-2">
															<Label className="font-bold">{t("schedule.end")}</Label>
															<Input
																type="datetime-local"
																className="bg-white"
																value={newBlock.end_datetime}
																onChange={(e) =>
																	setNewBlock({
																		...newBlock,
																		end_datetime: e.target.value,
																	})
																}
															/>
														</div>
													</div>
													<div className="space-y-2">
														<Label className="font-bold">{t("schedule.reason")}</Label>
														<Input
															className="bg-white"
															placeholder={t("schedule.reasonPlaceholder")}
															value={newBlock.reason}
															onChange={(e) =>
																setNewBlock({
																	...newBlock,
																	reason: e.target.value,
																})
															}
														/>
													</div>
													<div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-2">
														<Button
															variant="ghost"
															className="w-full sm:w-auto justify-center"
															onClick={() => setIsAddingBlock(false)}
														>
															{t("booking.back")}
														</Button>
														<Button className="w-full sm:w-auto justify-center shadow-md font-bold" onClick={() => handleCreateBlock(newBlock)}>
															{t("schedule.saveBlock")}
														</Button>
													</div>
												</div>
											</Card>
										)}

										<div className="grid gap-3 sm:gap-4">
											{blocks.length > 0 ? (
												blocks.map((block, idx) => (
													<div
														key={idx}
														className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-red-100 bg-red-50/30 rounded-2xl gap-3 sm:gap-0 shadow-xs"
													>
														<div>
															<p className="font-bold text-red-900 text-base sm:text-lg">
																{block.reason || t("schedule.manualBlock")}
															</p>
															<p className="text-xs sm:text-sm text-red-700/80 mt-1 leading-relaxed">
																<span className="font-semibold">{t("schedule.start")}:</span>{" "}
																{new Date(
																	block.start_datetime,
																).toLocaleString(i18n.language === "es" ? "es-ES" : "en-US")}
																<br />
																<span className="font-semibold">{t("schedule.end")}:</span>{" "}
																{new Date(block.end_datetime).toLocaleString(i18n.language === "es" ? "es-ES" : "en-US")}
															</p>
														</div>
														<Button
															variant="ghost"
															className="text-red-600 hover:bg-red-50 rounded-xl self-end sm:self-auto font-bold border border-red-100 sm:border-none shadow-xs sm:shadow-none bg-white sm:bg-transparent"
															size="sm"
															onClick={() =>
																block.internal_id &&
																handleDeleteBlock(block.internal_id)
															}
														>
															{t("schedule.delete")}
														</Button>
													</div>
												))
											) : (
												<p className="text-center py-12 text-muted-foreground italic bg-muted/10 rounded-2xl border border-dashed border-border">
													{t("schedule.noBlocks")}
												</p>
											)}
										</div>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
