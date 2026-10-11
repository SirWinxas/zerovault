import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "highlight";
type Size = "md" | "sm" | "icon";

const base =
  "inline-flex items-center justify-center gap-2 font-bold border-2 border-carbon rounded-full cursor-pointer transition active:translate-y-px disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet/50";
const variants: Record<Variant, string> = {
  primary: "bg-carbon text-paper",
  secondary: "bg-paper text-carbon",
  ghost: "bg-transparent text-carbon",
  danger: "bg-ember text-paper",
  highlight: "bg-sunburst text-carbon",
};
const sizes: Record<Size, string> = {
  md: "px-5 py-3 text-sm tracking-wide",
  sm: "px-3 py-2 text-xs tracking-wide",
  icon: "h-10 w-10 p-0",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: Props) {
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}
