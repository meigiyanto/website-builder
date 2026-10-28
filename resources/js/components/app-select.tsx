import Select, { type SingleValue, type StylesConfig } from 'react-select';

export type AppSelectOption = {
    value: string;
    label: string;
};

type AppSelectProps = {
    options: AppSelectOption[];
    value: string;
    onChange: (value: string) => void;
    ariaLabel: string;
    className?: string;
};

const selectStyles: StylesConfig<AppSelectOption, false> = {
    container: (base) => ({ ...base, width: '100%', minWidth: 0 }),
    control: (base, state) => ({
        ...base,
        minHeight: 38,
        borderColor: state.isFocused ? '#6366f1' : '#d1d5db',
        boxShadow: state.isFocused ? '0 0 0 2px rgba(99, 102, 241, 0.15)' : 'none',
        borderRadius: 8,
        fontSize: 13,
        '&:hover': {
            borderColor: '#6366f1',
        },
    }),
    valueContainer: (base) => ({ ...base, padding: '2px 10px' }),
    input: (base) => ({ ...base, color: '#24263a' }),
    menu: (base) => ({ ...base, zIndex: 10000, fontSize: 13 }),
    menuPortal: (base) => ({ ...base, zIndex: 10000 }),
    option: (base, state) => ({
        ...base,
        cursor: 'pointer',
        backgroundColor: state.isSelected ? '#4f46e5' : state.isFocused ? '#eef2ff' : '#ffffff',
        color: state.isSelected ? '#ffffff' : '#24263a',
        padding: '9px 12px',
    }),
};

export default function AppSelect({
    options,
    value,
    onChange,
    ariaLabel,
    className,
}: AppSelectProps) {
    const selectedOption = options.find((option) => option.value === value) ?? null;

    const handleChange = (option: SingleValue<AppSelectOption>) => {
        onChange(option?.value ?? '');
    };

    return (
        <Select<AppSelectOption, false>
            instanceId="editor-category-filter"
            inputId="editor-category-filter-input"
            className={className}
            classNamePrefix="app-select"
            options={options}
            value={selectedOption}
            onChange={handleChange}
            styles={selectStyles}
            isSearchable
            isClearable={false}
            placeholder="..."
            aria-label={ariaLabel}
            noOptionsMessage={() => 'Tidak ada opsi yang cocok'}
            menuPortalTarget={
                typeof document !== 'undefined' ? document.body : undefined
            }
        />
    );
}
