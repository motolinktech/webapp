import { Badge } from "@/components/ui/badge";
import { classHelper } from "@/lib/utils/class-helper";

export interface BadgeSelectOption {
  value: string;
  label: string;
}

interface BadgeSelectProps {
  options: readonly BadgeSelectOption[] | BadgeSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  className?: string;
}

export function BadgeSelect({ options, value, onChange, className }: BadgeSelectProps) {
  const toggle = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  return (
    <div className={classHelper("flex flex-wrap gap-2", className)}>
      {options.map((option) => (
        <Badge
          key={option.value}
          variant={value.includes(option.value) ? "default" : "outline"}
          className="cursor-pointer hover:opacity-80 transition-opacity py-1.5 px-3"
          onClick={() => toggle(option.value)}
        >
          <span className="text-xs">{option.label}</span>
        </Badge>
      ))}
    </div>
  );
}
