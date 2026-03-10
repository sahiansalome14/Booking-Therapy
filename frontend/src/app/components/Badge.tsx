import type React from "react";

interface BadgeProps {
	children: React.ReactNode;
	variant?: "default" | "success" | "warning" | "danger" | "info";
	className?: string;
}

export function Badge({
	children,
	variant = "default",
	className = "",
}: BadgeProps) {
	const variants = {
		default:
			"bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 border border-blue-200",
		success:
			"bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200",
		warning:
			"bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700 border border-amber-200",
		danger:
			"bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border border-red-200",
		info: "bg-gradient-to-r from-sky-50 to-blue-50 text-sky-700 border border-sky-200",
	};

	return (
		<span
			className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 hover:scale-105 ${variants[variant]} ${className}`}
		>
			{children}
		</span>
	);
}
