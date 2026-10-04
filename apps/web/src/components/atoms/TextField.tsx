import { useId, type InputHTMLAttributes } from "react";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function TextField({ label, ...props }: TextFieldProps) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm text-slate-300">
        {label}
      </label>
      <input
        id={id}
        className="rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-white outline-none focus:border-indigo-400"
        {...props}
      />
    </div>
  );
}
