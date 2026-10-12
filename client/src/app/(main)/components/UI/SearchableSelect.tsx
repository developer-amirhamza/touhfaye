"use client";
import React, { useEffect, useRef, useState } from "react";

export interface SearchableOption {
    id: string;
    name: string;
}

interface SearchableSelectProps {
    options: SearchableOption[];
    value: string; // selected option id ("" = none)
    onChange: (id: string, name: string) => void;
    placeholder: string;
    disabledPlaceholder?: string;
    disabled?: boolean;
    required?: boolean;
    className?: string;
    // Rendered pinned at the bottom of the dropdown regardless of the
    // search text, so it's always reachable (e.g. an "Other / not
    // listed…" escape hatch for options the search can't find).
    footerOption?: SearchableOption;
}

// A text input with a live-filtered, click/keyboard-selectable dropdown —
// the native <select> has no real search, and some of these lists run to
// thousands of options (unions.json alone is ~4.5k rows).
const SearchableSelect: React.FC<SearchableSelectProps> = ({
    options,
    value,
    onChange,
    placeholder,
    disabledPlaceholder,
    disabled,
    required,
    className,
    footerOption,
}) => {
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const [highlight, setHighlight] = useState(0);
    const rootRef = useRef<HTMLDivElement>(null);

    const allOptions = footerOption ? [...options, footerOption] : options;
    const selected = allOptions.find((o) => o.id === value);

    // Keep the visible text in sync with the controlled selection whenever
    // it changes from outside (e.g. a parent level resetting this field).
    useEffect(() => {
        setQuery(selected ? selected.name : "");
    }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        const onClickOutside = (e: MouseEvent) => {
            if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
                setOpen(false);
                setQuery(selected ? selected.name : "");
            }
        };
        document.addEventListener("mousedown", onClickOutside);
        return () => document.removeEventListener("mousedown", onClickOutside);
    }, [selected]);

    const filtered = query.trim() === ""
        ? options
        : options.filter((o) => o.name.toLowerCase().includes(query.trim().toLowerCase()));

    const pick = (opt: SearchableOption) => {
        onChange(opt.id, opt.name);
        setQuery(opt.name);
        setOpen(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
            setOpen(true);
            return;
        }
        if (!open) return;
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlight((h) => Math.min(h + 1, filtered.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlight((h) => Math.max(h - 1, 0));
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (filtered[highlight]) pick(filtered[highlight]);
        } else if (e.key === "Escape") {
            setOpen(false);
            setQuery(selected ? selected.name : "");
        }
    };

    return (
        <div ref={rootRef} className="relative">
            <input
                type="text"
                value={query}
                disabled={disabled}
                required={required}
                placeholder={disabled ? (disabledPlaceholder ?? placeholder) : placeholder}
                onFocus={() => { setOpen(true); setHighlight(0); }}
                onChange={(e) => {
                    setQuery(e.target.value);
                    setOpen(true);
                    setHighlight(0);
                    if (value) onChange("", ""); // typing invalidates the previous pick
                }}
                onKeyDown={handleKeyDown}
                className={className}
                autoComplete="off"
            />
            {open && !disabled && (
                <div className="absolute z-20 top-full left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white border border-primary-hover shadow-lg">
                    {filtered.length === 0 ? (
                        <div className="px-4 py-2.5 text-sm text-foreground font-light">No matches</div>
                    ) : (
                        filtered.slice(0, 200).map((o, i) => (
                            <div
                                key={o.id}
                                onMouseDown={(e) => { e.preventDefault(); pick(o); }}
                                onMouseEnter={() => setHighlight(i)}
                                className={`px-4 py-2 text-sm cursor-pointer ${i === highlight ? "bg-primary" : ""}`}
                            >
                                {o.name}
                            </div>
                        ))
                    )}
                    {footerOption && (
                        <div
                            onMouseDown={(e) => { e.preventDefault(); pick(footerOption); }}
                            className="px-4 py-2 text-sm cursor-pointer text-accent border-t border-primary-hover"
                        >
                            {footerOption.name}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchableSelect;
