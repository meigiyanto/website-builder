import type { LucideIcon } from 'lucide-react';

export type InspectorIconOption = {
    value: string;
    label: string;
    icon: LucideIcon;
};

type InspectorIconToggleGroupProps = {
    value: string;
    options: InspectorIconOption[];
    onChange: (value: string) => void;
    ariaLabel: string;
};

export default function InspectorIconToggleGroup({
    value,
    options,
    onChange,
    ariaLabel,
}: InspectorIconToggleGroupProps) {
    return (
        <div
            className="inspector-icon-toggle-group"
            role="group"
            aria-label={ariaLabel}
        >
            {options.map(({ value: optionValue, label, icon: Icon }) => {
                const isActive = value === optionValue;

                return (
                    <button
                        key={optionValue || 'default'}
                        type="button"
                        className="inspector-icon-toggle"
                        data-active={isActive}
                        aria-label={label}
                        aria-pressed={isActive}
                        title={label}
                        onClick={() => onChange(optionValue)}
                    >
                        <Icon size={16} strokeWidth={1.8} />
                    </button>
                );
            })}
        </div>
    );
}
