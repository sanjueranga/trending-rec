"use client";

import { useState } from "react";
const N8N_URL = process.env.NEXT_PUBLIC_N8N_URL || "";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { AutocompleteInput, type AutocompleteOption } from "@/components/ui/autocomplete-input";
import { useTopicSuggestions } from "@/hooks/useTopicSuggestions";
import { generatePrompts, ApiError } from "@/lib/api/generation";
import toast from "react-hot-toast";

type GeneratedPrompt = {
    id: string;
    content: string;
};

export default function PromptForm() {
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

    // Use hooks
    const { suggestions, loading } = useTopicSuggestions(topic);

    const handleTopicSelect = (option: AutocompleteOption) => {
        setTopic(option.name);
        toast.success(`Selected "${option.name}" as your topic.`, {
            duration: 2000,
        });
        console.log("Selected topic:", option);
    };

    // Fetch trending theme/content from n8n workflow
    const fetchTrendingTheme = async (topicValue: string, intentionValue: string) => {
        if (!topicValue.trim() || !intentionValue) {
            toast.error("Please select both topic and intention before enabling auto trending theme.");
            return null;
        }
        setIsFetchingTrendingTheme(true);
        setN8nLoading(true);
        const loadingToast = toast.loading("Contacting n8n for trending theme...", { duration: 3000 });
        try {
            const url = `${N8N_URL}?topic=${encodeURIComponent(topicValue)}&intention=${encodeURIComponent(intentionValue)}`;
            const res = await fetch(url, { method: "GET" });
            if (!res.ok) throw new Error("n8n workflow error");
            const data = await res.json();
            if (typeof data.theme === "string") setTrendingTheme(data.theme);
            if (typeof data.content === "string") setContent(data.content);
            toast.success("Trending theme and content loaded from n8n!", { duration: 2000 });
            return data.theme;
        } catch (error) {
            toast.error("Unable to fetch from n8n. Please try again or use manual theme.");
            setTrendingTheme("");
            setContent("");
            return null;
        } finally {
            setIsFetchingTrendingTheme(false);
            setN8nLoading(false);
            toast.dismiss(loadingToast);
        }
    };

    // Real API call to generate prompts
    const fetchPrompts = async (): Promise<GeneratedPrompt[]> => {
        // Send all form data including theme and content
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
        // Validate form before proceeding
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
                        <Select value={intention} onValueChange={setIntention}>
                            <SelectTrigger id="intention">
                                <SelectValue placeholder="Select an intention" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="video">Video Creation</SelectItem>
                                <SelectItem value="app">Application Development</SelectItem>
                                <SelectItem value="learning">Learning</SelectItem>
                                <SelectItem value="article">Article Writing</SelectItem>
                                <SelectItem value="social">Social Media Post</SelectItem>
                                <SelectItem value="podcast">Podcast Script</SelectItem>
                                <SelectItem value="newsletter">Newsletter</SelectItem>
                                <SelectItem value="review">Product Review</SelectItem>
                                <SelectItem value="trend">Trend Analysis</SelectItem>
                                <SelectItem value="presentation">Presentation</SelectItem>
                                <SelectItem value="research">Research</SelectItem>
                                <SelectItem value="case">Case Study</SelectItem>
                                <SelectItem value="interview">Interview Preparation</SelectItem>
                            </SelectContent>
                        </Select>
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
                                            // Fetch from n8n
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
                        {autoTheme && (
                            <div className="pt-2">
                                <Label htmlFor="content" className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Content</Label>
                                <Textarea
                                    id="content"
                                    placeholder="Content from n8n will appear here..."
                                    value={content}
                                    onChange={e => setContent(e.target.value)}
                                    className="min-h-[60px] text-sm sm:text-base bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-black dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                                    rows={2}
                                    disabled={n8nLoading}
                                />
                                {n8nLoading && <div className="text-xs text-blue-500 mt-1">Loading from n8n...</div>}
                            </div>
                        )}
                    </div>

                    {/* Brand Instructions removed as per new requirements */}

                    {/* Generate Button */}
                    <div className="pt-4 sm:pt-6">
                        <Button
                            className="w-full h-12 sm:h-14 text-sm sm:text-base font-medium bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black border-black dark:border-white"
                            onClick={handleGeneratePrompts}
                            disabled={isGenerating || !isFormValid()}
                        >
                            {isGenerating ? "Generating..." : "Generate Prompts"}
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
            </Card>
        </div>
    );
}
