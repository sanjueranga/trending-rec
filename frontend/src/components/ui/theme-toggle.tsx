"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export function ThemeToggle() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    // useEffect only runs on the client, so now we can safely show the UI
    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return null
    }

    const isDark = theme === "dark"

    return (
        <div className="flex items-center space-x-2">
            <Label htmlFor="theme-toggle" className="text-sm font-medium">
                🌙
            </Label>
            <Switch
                id="theme-toggle"
                checked={isDark}
                onCheckedChange={(checked) => {
                    setTheme(checked ? "dark" : "light")
                }}
            />
            <Label htmlFor="theme-toggle" className="text-sm font-medium">
                ☀️
            </Label>
        </div>
    )
}