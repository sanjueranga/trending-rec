"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export interface AutocompleteOption {
    id: string
    name: string
    category?: string
}

interface AutocompleteInputProps {
    value: string
    onChange: (value: string) => void
    onSelect: (option: AutocompleteOption) => void
    options: AutocompleteOption[]
    placeholder?: string
    loading?: boolean
    className?: string
    id?: string
}

export function AutocompleteInput({
    value,
    onChange,
    onSelect,
    options,
    placeholder,
    loading = false,
    className,
    id,
}: AutocompleteInputProps) {
    const [isOpen, setIsOpen] = React.useState(false)
    const [selectedIndex, setSelectedIndex] = React.useState(-1)
    const inputRef = React.useRef<HTMLInputElement>(null)
    const listRef = React.useRef<HTMLUListElement>(null)

    // Close dropdown when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
                setIsOpen(false)
                setSelectedIndex(-1)
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen) {
            if (e.key === "ArrowDown" && options.length > 0) {
                setIsOpen(true)
                setSelectedIndex(0)
                e.preventDefault()
            }
            return
        }

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault()
                setSelectedIndex(prev => (prev < options.length - 1 ? prev + 1 : prev))
                break
            case "ArrowUp":
                e.preventDefault()
                setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev))
                break
            case "Enter":
                e.preventDefault()
                if (selectedIndex >= 0 && options[selectedIndex]) {
                    handleSelect(options[selectedIndex])
                }
                break
            case "Escape":
                setIsOpen(false)
                setSelectedIndex(-1)
                break
        }
    }

    const handleSelect = (option: AutocompleteOption) => {
        onChange(option.name)
        onSelect(option)
        setIsOpen(false)
        setSelectedIndex(-1)
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value
        onChange(newValue)
        setIsOpen(true)
        setSelectedIndex(-1)
    }

    const showDropdown = isOpen && (options.length > 0 || loading)

    return (
        <div className="relative" ref={inputRef}>
            <Input
                id={id}
                value={value}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className={className}
                autoComplete="off"
            />

            {showDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                    {loading && (
                        <div className="flex items-center justify-center py-3 text-sm text-muted-foreground">
                            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full mr-2"></div>
                            Loading suggestions...
                        </div>
                    )}

                    {!loading && options.length > 0 && (
                        <ul ref={listRef} className="py-1">
                            {options.map((option, index) => (
                                <li key={option.id}>
                                    <button
                                        type="button"
                                        className={cn(
                                            "w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none",
                                            index === selectedIndex && "bg-accent text-accent-foreground"
                                        )}
                                        onClick={() => handleSelect(option)}
                                        onMouseEnter={() => setSelectedIndex(index)}
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-medium">{option.name}</span>
                                            {option.category && (
                                                <span className="text-xs text-muted-foreground">{option.category}</span>
                                            )}
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}

                    {!loading && options.length === 0 && value.length >= 2 && (
                        <div className="py-3 px-3 text-sm text-muted-foreground">
                            No suggestions found for &ldquo;{value}&rdquo;
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}