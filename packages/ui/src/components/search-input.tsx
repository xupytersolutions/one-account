"use client";
import { Input } from "@heroui/react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
};

export function SearchInput({ value, onChange, placeholder = "Search...", ariaLabel }: SearchInputProps) {
  return (
    <div className="flex-1 relative min-w-0">
      <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" style={{ width: 20, height: 20 }} />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange((e.target as HTMLInputElement).value)}
        className="pl-10 w-full"
        aria-label={ariaLabel ?? placeholder}
      />
    </div>
  );
}
