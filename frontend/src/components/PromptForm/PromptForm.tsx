"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { AutocompleteInput, type AutocompleteOption } from "@/components/ui/autocomplete-input";
import { useTopicSuggestions } from "@/hooks/useTopicSuggestions";
import toast from "react-hot-toast";

type GeneratedPrompt = {
    id: string;
    title: string;
    content: string;
};

export default function PromptForm() {
    const [topic, setTopic] = useState("");
    const [autoTheme, setAutoTheme] = useState(false);
    const [intention, setIntention] = useState("");
    const [theme, setTheme] = useState("");
    const [instructions, setInstructions] = useState("");
    const [generatedPrompts, setGeneratedPrompts] = useState<GeneratedPrompt[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);

    // Use hooks
    const { suggestions, loading } = useTopicSuggestions(topic);

    const handleTopicSelect = (option: AutocompleteOption) => {
        setTopic(option.name);
        toast.success(`Selected "${option.name}" as your topic.`, {
            duration: 2000,
        });
        console.log("Selected topic:", option);
    };

    // Mock function to simulate API call
    const mockFetchPrompts = async (): Promise<GeneratedPrompt[]> => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        const mockPrompts: GeneratedPrompt[] = [
            {
                id: "1",
                title: "Creative Prompt 1",
                content: `Create engaging ${intention || 'content'} about ${topic || 'your topic'} with a focus on ${autoTheme ? 'trending themes' : theme || 'custom styling'}. ${instructions ? `Brand guidelines: ${instructions}` : 'Follow best practices for audience engagement.'}`
            },
            {
                id: "2",
                title: "Strategic Prompt 2",
                content: `Design compelling ${intention || 'content'} that explores ${topic || 'your chosen subject'} using ${autoTheme ? 'current trending approaches' : theme || 'your specified theme'}. ${instructions ? `Incorporate brand identity: ${instructions}` : 'Ensure content aligns with target audience expectations.'}`
            }
        ];

        return mockPrompts;
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
            theme: autoTheme ? "Auto Trending Theme" : theme,
            autoTheme,
            instructions
        };

        console.log("Form Data:", JSON.stringify(formData, null, 2));

        setIsGenerating(true);
        toast.loading("Please wait while we create your custom prompts...", {
            duration: 2000
        });

        try {
            const prompts = await mockFetchPrompts();
            setGeneratedPrompts(prompts);
            toast.success(`Generated ${prompts.length} custom prompts for your ${intention} project.`);
        } catch (error) {
            console.error("Error generating prompts:", error);
            toast.error("Sorry, we couldn't generate prompts right now. Please try again.");
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
        const isThemeFilled = autoTheme || theme.trim() !== "";

        return isTopicFilled && isIntentionFilled && isThemeFilled;
    };

    const clearGeneratedPrompts = () => {
        setGeneratedPrompts([]);
        toast.success("Generated prompts cleared!", {
            duration: 2000,
        });
    };

    return (
        <Card className="max-w-2xl mx-auto p-6 space-y-6">
            <CardHeader>
                <h2 className="text-xl font-bold">Configure Your Prompt</h2>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Topic */}
                <div className="space-y-2">
                    <Label htmlFor="topic">Topic</Label>
                    <AutocompleteInput
                        id="topic"
                        value={topic}
                        onChange={setTopic}
                        onSelect={handleTopicSelect}
                        options={suggestions}
                        loading={loading}
                        placeholder="e.g. Education, Technology, Business"
                    />
                </div>

                {/* Intention */}
                <div className="space-y-2">
                    <Label htmlFor="intention">Intention</Label>
                    <Select value={intention} onValueChange={setIntention}>
                        <SelectTrigger id="intention">
                            <SelectValue placeholder="Select an intention" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="video">Video Creation</SelectItem>
                            <SelectItem value="app">Application Development</SelectItem>
                            <SelectItem value="learning">Learning</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Theme */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="theme">Theme</Label>
                        <div className="flex items-center gap-2">
                            <Switch
                                checked={autoTheme}
                                onCheckedChange={(checked) => {
                                    setAutoTheme(checked);
                                    const message = checked
                                        ? "Auto theme enabled - we'll use trending themes for your prompts."
                                        : "Auto theme disabled - please specify a custom theme below.";
                                    toast(message, {
                                        duration: 2000,
                                        icon: checked ? '✨' : '🎨'
                                    });
                                }}
                            />
                            <span className="text-sm">Auto Trending Theme</span>
                        </div>
                    </div>
                    <Input
                        id="theme"
                        placeholder="Enter theme (if not auto)"
                        disabled={autoTheme}
                        value={theme}
                        onChange={(e) => setTheme(e.target.value)}
                    />
                </div>

                {/* Brand Instructions */}
                <div className="space-y-2">
                    <Label htmlFor="instructions">Brand Instructions</Label>
                    <Textarea
                        id="instructions"
                        placeholder="Enter any brand identity/system instructions"
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                    />
                </div>

                {/* Generate Button */}
                <div className="pt-4">
                    <Button
                        className="w-full"
                        onClick={handleGeneratePrompts}
                        disabled={isGenerating || !isFormValid()}
                    >
                        {isGenerating ? "Generating..." : "Generate Prompts"}
                    </Button>
                </div>

                {/* Generated Prompts Display */}
                {generatedPrompts.length > 0 && (
                    <div className="pt-6 space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold">Generated Prompts</h3>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={clearGeneratedPrompts}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950"
                            >
                                Clear All
                            </Button>
                        </div>
                        {generatedPrompts.map((prompt) => (
                            <Card key={prompt.id} className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-medium">{prompt.title}</h4>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => copyToClipboard(prompt.content, prompt.title)}
                                    >
                                        Copy
                                    </Button>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                    {prompt.content}
                                </p>
                            </Card>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
