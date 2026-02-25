import { Input } from "./ui/input";
import { cn } from "../lib/utils";

// Phone input with fixed +91 prefix
export default function PhoneInput({ 
  value, 
  onChange, 
  placeholder = "Enter 10-digit number",
  className,
  disabled,
  ...props 
}) {
  // Strip any +91 prefix from displayed value
  const displayValue = value?.replace(/^\+?91/, '') || '';
  
  const handleChange = (e) => {
    // Only allow digits
    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
    // Always store with +91 prefix
    onChange(digits ? `+91${digits}` : '');
  };

  return (
    <div className={cn("flex", className)}>
      <div className="flex items-center justify-center px-3 bg-muted border border-r-0 border-input rounded-l-md text-sm font-medium text-muted-foreground min-w-[60px]">
        +91
      </div>
      <Input
        type="tel"
        inputMode="numeric"
        pattern="[0-9]*"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        maxLength={10}
        disabled={disabled}
        className="rounded-l-none"
        {...props}
      />
    </div>
  );
}

// Compact version for forms
export function PhoneInputCompact({ 
  value, 
  onChange, 
  placeholder = "10-digit number",
  className,
  ...props 
}) {
  const displayValue = value?.replace(/^\+?91/, '') || '';
  
  const handleChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
    onChange(digits ? `+91${digits}` : '');
  };

  return (
    <div className={cn("relative", className)}>
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
        +91
      </span>
      <Input
        type="tel"
        inputMode="numeric"
        pattern="[0-9]*"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        maxLength={10}
        className="pl-12"
        {...props}
      />
    </div>
  );
}
