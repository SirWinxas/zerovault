import { useId, type InputHTMLAttributes } from "react";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function TextField({ label, ...props }: TextFieldProps) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-bold uppercase tracking-wide">
        {label}
      </label>
      <input
        id={id}
        className="w-full rounded-[14px] border-2 border-carbon bg-paper px-3.5 py-3 text-[15px] text-carbon outline-none focus-visible:ring-4 focus-visible:ring-blue/50"
        {...props}
      />
    </div>
  );
}
