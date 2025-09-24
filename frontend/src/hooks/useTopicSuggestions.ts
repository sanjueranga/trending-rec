"use client"

import { useState, useEffect, useCallback } from "react"
import { searchTopics, type TopicSuggestion } from "@/lib/api/topics"

interface UseTopicSuggestionsReturn {
    suggestions: TopicSuggestion[]
    loading: boolean
    error: string | null
}

export function useTopicSuggestions(query: string, debounceMs: number = 300): UseTopicSuggestionsReturn {
    const [suggestions, setSuggestions] = useState<TopicSuggestion[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchSuggestions = useCallback(async (searchQuery: string) => {
        if (!searchQuery || searchQuery.length < 2) {
            setSuggestions([])
            setLoading(false)
            return
        }

        setLoading(true)
        setError(null)

        try {
            const results = await searchTopics(searchQuery)
            setSuggestions(results)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch suggestions")
            setSuggestions([])
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchSuggestions(query)
        }, debounceMs)

        return () => clearTimeout(timer)
    }, [query, debounceMs, fetchSuggestions])

    return { suggestions, loading, error }
}