import { GraduationCap } from "lucide-react";

export function BrandLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const px = size === "lg" ? "h-9 w-9" : size === "sm" ? "h-6 w-6" : "h-7 w-7";
  return (
    <div className={`${px} rounded-lg grid place-items-center bg-primary text-primary-foreground shadow-md shadow-primary/30`}>
      <GraduationCap className="h-1/2 w-1/2" strokeWidth={2.5} />
    </div>
  );
}

export function BrandWordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display font-semibold tracking-tight ${className}`}>
      Campus<span className="text-primary">AI</span>
    </span>
  );
}