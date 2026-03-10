import type React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?:
		| "primary"
		| "secondary"
		| "outline"
		| "ghost"
		| "destructive"
		| "gradient";
	size?: "sm" | "md" | "lg";
	children: React.ReactNode;
}

export function Button({
	variant = "primary",
	size = "md",
	children,
	className = "",
	...props
}: ButtonProps) {
	const baseStyles =
		"inline-flex items-center justify-center rounded-xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group";

	const variants = {
		primary:
			"bg-[#2563EB] text-white hover:bg-[#1E40AF] hover:shadow-lg hover:shadow-blue-500/30 hover:scale-105 active:scale-95",
		secondary:
			"bg-[#06B6D4] text-white hover:bg-[#0891B2] hover:shadow-lg hover:shadow-cyan-500/30 hover:scale-105 active:scale-95",
		outline:
			"border-2 border-[#2563EB] text-[#2563EB] bg-transparent hover:bg-[#2563EB] hover:text-white hover:shadow-lg hover:shadow-blue-500/20 hover:scale-105 active:scale-95",
		ghost: "hover:bg-[#E0F2FE] text-[#2563EB] hover:scale-105 active:scale-95",
		destructive:
			"bg-[#EF4444] text-white hover:bg-[#DC2626] hover:shadow-lg hover:shadow-red-500/30 hover:scale-105 active:scale-95",
		gradient:
			"bg-gradient-to-r from-[#2563EB] via-[#06B6D4] to-[#10B981] text-white hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105 active:scale-95 before:absolute before:inset-0 before:bg-gradient-to-r before:from-[#1E40AF] before:via-[#0891B2] before:to-[#059669] before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300",
	};

	const sizes = {
		sm: "px-4 py-2 text-sm",
		md: "px-6 py-2.5",
		lg: "px-8 py-3.5 text-lg",
	};

	return (
		<button
			className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
			{...props}
		>
			<span className="relative z-10">{children}</span>
		</button>
	);
}
