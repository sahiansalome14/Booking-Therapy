import type React from "react";

interface CardProps {
	children: React.ReactNode;
	className?: string;
	onClick?: () => void;
	hover?: boolean;
}

export function Card({
	children,
	className = "",
	onClick,
	hover = true,
}: CardProps) {
	return (
		<div
			className={`bg-card border border-border rounded-2xl p-6 transition-all duration-300 ${
				hover
					? "hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1 hover:border-blue-300"
					: "shadow-md"
			} ${onClick ? "cursor-pointer" : ""} ${className}`}
			onClick={onClick}
			style={{
				boxShadow: "0 2px 8px rgba(37, 99, 235, 0.06)",
			}}
		>
			{children}
		</div>
	);
}
