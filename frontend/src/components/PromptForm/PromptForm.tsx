"use client";

import { useState, useEffect } from "react";
const N8N_URL = process.env.NEXT_PUBLIC_N8N_URL || "";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import { AutocompleteInput, type AutocompleteOption } from "@/components/ui/autocomplete-input";
import { useTopicSuggestions } from "@/hooks/useTopicSuggestions";
import { generatePrompts, ApiError } from "@/lib/api/generation";
import toast from "react-hot-toast";

type GeneratedPrompt = {
    id: string;
    content: string;
};

type TechQuote = {
    quote: string;
    author: string;
    company?: string;
};

const TECH_QUOTES: TechQuote[] = [
    {
        quote: "The best way to predict the future is to invent it.",
        author: "Alan Kay",
        company: "Xerox PARC"
    },
    {
        quote: "Innovation distinguishes between a leader and a follower.",
        author: "Steve Jobs",
        company: "Apple"
    },
    {
        quote: "Your most unhappy customers are your greatest source of learning.",
        author: "Bill Gates",
        company: "Microsoft"
    },
    {
        quote: "Move fast and break things. Unless you are breaking stuff, you are not moving fast enough.",
        author: "Mark Zuckerberg",
        company: "Meta"
    },
    {
        quote: "The biggest risk is not taking any risk... In a world that's changing quickly, the only strategy that is guaranteed to fail is not taking risks.",
        author: "Mark Zuckerberg",
        company: "Meta"
    },
    {
        quote: "If you're not embarrassed by the first version of your product, you've launched too late.",
        author: "Reid Hoffman",
        company: "LinkedIn"
    },
    {
        quote: "Focus on the user and all else will follow.",
        author: "Larry Page",
        company: "Google"
    },
    {
        quote: "It's better to be wrong than to be vague.",
        author: "Freeman Dyson"
    },
    {
        quote: "The way to get started is to quit talking and begin doing.",
        author: "Walt Disney"
    },
    {
        quote: "Don't be afraid to give up the good to go for the great.",
        author: "John D. Rockefeller"
    },
    {
        quote: "Failure is simply the opportunity to begin again, this time more intelligently.",
        author: "Henry Ford"
    },
    {
        quote: "Code is like humor. When you have to explain it, it's bad.",
        author: "Cory House"
    },
    {
        quote: "Measuring programming progress by lines of code is like measuring aircraft building progress by weight.",
        author: "Bill Gates",
        company: "Microsoft"
    },
    {
        quote: "The best error message is the one that never shows up.",
        author: "Thomas Fuchs"
    },
    {
        quote: "Simplicity is the ultimate sophistication.",
        author: "Leonardo da Vinci"
    }
];

// Loading Popup Component
const ThemeGeneratingPopup = ({ isVisible, onClose, canClose }: { isVisible: boolean; onClose: () => void; canClose: boolean }) => {
    const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
    const [fadeClass, setFadeClass] = useState("opacity-100");

    useEffect(() => {
        if (!isVisible) return;

        const interval = setInterval(() => {
            setFadeClass("opacity-0");
            setTimeout(() => {
                setCurrentQuoteIndex((prev) => (prev + 1) % TECH_QUOTES.length);
                setFadeClass("opacity-100");
            }, 300);
        }, 5000);

        return () => clearInterval(interval);
    }, [isVisible]);

    if (!isVisible) return null;

    const currentQuote = TECH_QUOTES[currentQuoteIndex];

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-100 dark:bg-[#18181b] rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden border border-gray-300 dark:border-gray-700">
                {/* Header */}
                <div className="bg-gray-900 dark:bg-gray-800 p-6 text-white">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold">Generating Your Theme</h3>
                        <button
                            onClick={canClose ? onClose : undefined}
                            className={`transition-colors p-1 rounded ${canClose ? "text-white/80 hover:text-white cursor-pointer" : "text-gray-400 cursor-not-allowed"}`}
                            disabled={!canClose}
                            aria-label="Close popup"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8">
                    {/* Loading Animation */}
                    <div className="flex justify-center mb-8">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-blue-400 dark:border-gray-700 rounded-full animate-spin border-t-blue-600 dark:border-t-blue-400"></div>
                            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent rounded-full animate-ping border-t-purple-400"></div>
                        </div>
                    </div>

                    {/* Status Text */}
                    <div className="text-center mb-8">
                        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            Analyzing Trending Topics...
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                            We&apos;re fetching the latest trends to create the perfect theme for your content
                        </p>
                    </div>

                    {/* Quote Section */}
                    <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border-l-4 border-blue-600 dark:border-blue-400">
                        <div className={`transition-opacity duration-300 ${fadeClass}`}>
                            <blockquote className="text-gray-800 dark:text-gray-200 italic text-center mb-4 text-lg leading-relaxed">
                                &quot;{currentQuote.quote}&quot;
                            </blockquote>
                            <div className="text-center">
                                <p className="font-semibold text-gray-900 dark:text-gray-100">
                                    — {currentQuote.author}
                                </p>
                                {currentQuote.company && (
                                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                                        {currentQuote.company}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default function PromptForm() {
    // ...existing state...
    const [topic, setTopic] = useState("");
    const [autoTheme, setAutoTheme] = useState(false);
    const [intention, setIntention] = useState("");
    const [theme, setTheme] = useState("");
    const [content, setContent] = useState("");
    const [generatedPrompts, setGeneratedPrompts] = useState<GeneratedPrompt[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isFetchingTrendingTheme, setIsFetchingTrendingTheme] = useState(false);
    const [n8nLoading, setN8nLoading] = useState(false);
    const [trendingTheme, setTrendingTheme] = useState("");
    const [showThemePopup, setShowThemePopup] = useState(false);

    // Use hooks
    const { suggestions, loading } = useTopicSuggestions(topic);

    const handleTopicSelect = (option: AutocompleteOption) => {
        setTopic(option.name);
        toast.success(`Selected "${option.name}" as your topic.`, {
            duration: 2000,
        });
        console.log("Selected topic:", option);
    };

    // Enhanced fetch trending theme with popup
    const fetchTrendingTheme = async (topicValue: string, intentionValue: string) => {
        if (!topicValue.trim() || !intentionValue) {
            toast.error("Please select both topic and intention before enabling auto trending theme.");
            return null;
        }

        setIsFetchingTrendingTheme(true);
        setN8nLoading(true);
        setShowThemePopup(true);

        try {
            const url = `${N8N_URL}?topic=${encodeURIComponent(topicValue)}&intention=${encodeURIComponent(intentionValue)}`;
            const res = await fetch(url, { method: "GET" });
            if (!res.ok) throw new Error("n8n workflow error");
            const data = await res.json();

            // Add a small delay to show the completion animation
            await new Promise(resolve => setTimeout(resolve, 1000));

            if (typeof data.theme === "string") setTrendingTheme(data.theme);
            if (typeof data.content === "string") setContent(data.content);

            setShowThemePopup(false);
            toast.success("Trending theme and content loaded successfully! 🚀", {
                duration: 3000,
                style: {
                    background: '#10B981',
                    color: 'white',
                }
            });
            return data.theme;
        } catch {
            setShowThemePopup(false);
            toast.error("Unable to fetch trending theme. Please try again or use manual theme.", {
                duration: 4000,
                style: {
                    background: '#EF4444',
                    color: 'white',
                }
            });
            setTrendingTheme("");
            setContent("");
            return null;
        } finally {
            setIsFetchingTrendingTheme(false);
            setN8nLoading(false);
        }
    };

    // Real API call to generate prompts
    const fetchPrompts = async (): Promise<GeneratedPrompt[]> => {
        const requestBody = {
            topic: topic,
            intention: intention,
            theme: autoTheme ? trendingTheme : theme,
            content: content
        };
        console.log("Sending request body:", JSON.stringify(requestBody, null, 2));
        const promptTexts = await generatePrompts(requestBody);
        return promptTexts.map((c, index) => ({ id: `prompt-${Date.now()}-${index}`, content: c.trim() }));
    };

    const handleGeneratePrompts = async () => {
        if (!isFormValid()) {
            toast.error("Please fill in all required fields (Topic, Intention, and Theme).");
            return;
        }

        const formData = {
            topic,
            intention,
            theme: autoTheme ? trendingTheme : theme,
            content
        };
        console.log("Form Data:", JSON.stringify(formData, null, 2));

        setIsGenerating(true);
        const loadingToast = toast.loading("Please wait while we create your custom prompts...");

        try {
            const prompts = await fetchPrompts();
            setGeneratedPrompts(prompts);
            toast.dismiss(loadingToast);
            toast.success(`Generated ${prompts.length} custom prompts for your ${intention} project.`);
        } catch (error) {
            console.error("Error generating prompts:", error);
            toast.dismiss(loadingToast);
            if (error instanceof ApiError) {
                if (error.statusCode === 0) {
                    toast.error("Cannot connect to server. Please check if the backend is running.");
                } else if (error.statusCode === 400) {
                    toast.error(`Invalid input: ${error.message}`);
                } else {
                    toast.error(error.message || "Failed to generate prompts. Please try again.");
                }
            } else {
                toast.error("An unexpected error occurred. Please try again.");
            }
        } finally {
            setIsGenerating(false);
        }
    };

    const copyToClipboard = async (text: string, promptTitle: string) => {
        try {
            await navigator.clipboard.writeText(text);
            toast.success(`${promptTitle} copied to clipboard!`, {
                duration: 2000
            });
        } catch (error) {
            console.error("Failed to copy:", error);
            toast.error("Unable to copy to clipboard. Please try again.");
        }
    };

    const isFormValid = () => {
        const isTopicFilled = topic.trim() !== "";
        const isIntentionFilled = intention !== "";
        const isThemeFilled = autoTheme ? trendingTheme.trim() !== "" : theme.trim() !== "";

        return isTopicFilled && isIntentionFilled && isThemeFilled;
    };

    const clearGeneratedPrompts = () => {
        setGeneratedPrompts([]);
        toast.success("Generated prompts cleared!", {
            duration: 2000,
        });
    };

    return (
        <>
            <ThemeGeneratingPopup
                isVisible={showThemePopup}
                onClose={() => {
                    setShowThemePopup(false);
                    setIsFetchingTrendingTheme(false);
                    setN8nLoading(false);
                    setAutoTheme(false);
                }}
                canClose={!isFetchingTrendingTheme && !n8nLoading}
            />

            <div className="w-full min-h-screen bg-white dark:bg-[#0a0a0a] px-4 py-6 lg:px-8">
                <Card className="w-full max-w-2xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900">
                    <CardHeader className="pb-4 sm:pb-6">
                        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-center sm:text-left text-black dark:text-white">Configure Your Prompt</h2>
                    </CardHeader>
                    <CardContent className="space-y-4 sm:space-y-6">
                        {/* Topic */}
                        <div className="space-y-2 sm:space-y-3">
                            <Label htmlFor="topic" className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300">Topic</Label>
                            <AutocompleteInput
                                id="topic"
                                value={topic}
                                onChange={setTopic}
                                onSelect={handleTopicSelect}
                                options={suggestions}
                                loading={loading}
                                placeholder="e.g. Education, Technology, Business"
                                className="text-sm sm:text-base bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-black dark:text-white"
                            />
                        </div>

                        {/* Intention */}
                        <div className="space-y-2 sm:space-y-3">
                            <Label htmlFor="intention" className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300">Intention</Label>
                            <input
                                id="intention"
                                type="text"
                                value={intention}
                                onChange={e => setIntention(e.target.value)}
                                placeholder="e.g. Article Writing, Video Creation, Learning, ..."
                                className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-black dark:text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Theme */}
                        <div className="space-y-2 sm:space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                                <Label htmlFor="theme" className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300">Theme</Label>
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <Switch
                                        checked={autoTheme}
                                        disabled={topic.trim() === "" || isFetchingTrendingTheme || n8nLoading}
                                        onCheckedChange={async (checked) => {
                                            if (checked) {
                                                if (!topic.trim()) {
                                                    toast.error("Please enter a topic first.");
                                                    return;
                                                }
                                                if (!intention) {
                                                    toast.error("Please select an intention first.");
                                                    return;
                                                }
                                                const fetchedTheme = await fetchTrendingTheme(topic, intention);
                                                if (fetchedTheme) {
                                                    setAutoTheme(true);
                                                }
                                            } else {
                                                setAutoTheme(false);
                                                setTrendingTheme("");
                                                setContent("");
                                                toast("Auto theme disabled - please specify a custom theme below.", {
                                                    duration: 2000,
                                                    icon: '🎨'
                                                });
                                            }
                                        }}
                                    />
                                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                        <span className="hidden sm:inline">Auto Trending Theme</span>
                                        <span className="sm:hidden">Auto Theme</span>
                                    </span>
                                </div>
                            </div>
                            <Textarea
                                id="theme"
                                placeholder={autoTheme ? "Trending theme will appear here..." : "Enter theme (if not auto)"}
                                disabled={autoTheme || isFetchingTrendingTheme || n8nLoading}
                                value={autoTheme ? trendingTheme : theme}
                                onChange={(e) => setTheme(e.target.value)}
                                className={`text-sm sm:text-base min-h-[60px] ${autoTheme
                                    ? "bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600"
                                    : "bg-white dark:bg-gray-800 text-black dark:text-white border-gray-300 dark:border-gray-600"
                                    }`}
                                rows={2}
                            />
                        </div>

                        {/* Generate Button */}
                        <div className="pt-4 sm:pt-6">
                            <Button
                                className="w-full h-12 sm:h-14 text-sm sm:text-base font-medium bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black border-black dark:border-white"
                                onClick={handleGeneratePrompts}
                                disabled={isGenerating || !isFormValid() || isFetchingTrendingTheme}
                            >
                                {isFetchingTrendingTheme && autoTheme
                                    ? "Analyzing Trends..."
                                    : isGenerating
                                        ? "Generating..."
                                        : "Generate Prompts"}
                            </Button>
                        </div>

                        {/* Generated Prompts Display */}
                        {generatedPrompts.length > 0 && (
                            <div className="pt-4 sm:pt-6 space-y-3 sm:space-y-4">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-4">
                                    <h3 className="text-base sm:text-lg font-semibold text-black dark:text-white">Generated Prompts</h3>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={clearGeneratedPrompts}
                                        className="text-black hover:text-gray-700 hover:bg-gray-100 dark:text-white dark:hover:text-gray-300 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600 self-start sm:self-auto"
                                    >
                                        <span className="hidden sm:inline">Clear All</span>
                                        <span className="sm:hidden">Clear</span>
                                    </Button>
                                </div>
                                {generatedPrompts.map((prompt, index) => (
                                    <Card key={prompt.id} className="p-3 sm:p-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600">
                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-4 mb-3">
                                            <h4 className="font-medium text-sm sm:text-base flex-1 text-black dark:text-white">Prompt {index + 1}</h4>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => copyToClipboard(prompt.content, `Prompt ${index + 1}`)}
                                                className="self-start sm:self-auto shrink-0 bg-white hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600 text-black dark:text-white"
                                            >
                                                <span className="hidden sm:inline">Copy</span>
                                                <span className="sm:hidden">📋</span>
                                            </Button>
                                        </div>
                                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed sm:leading-loose break-words hyphens-auto">
                                            {prompt.content}
                                        </p>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card >
            </div >
        </>
    );
}