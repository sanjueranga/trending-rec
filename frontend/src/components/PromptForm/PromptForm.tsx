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

export default function PromptForm() {
    const [topic, setTopic] = useState("");
    const [autoTheme, setAutoTheme] = useState(false);
    const [intention, setIntention] = useState("");
    const [theme, setTheme] = useState("");
    const [instructions, setInstructions] = useState("");

    // Use the topic suggestions hook
    const { suggestions, loading } = useTopicSuggestions(topic);

    const handleTopicSelect = (option: AutocompleteOption) => {
        setTopic(option.name);
        // You can add additional logic here when a topic is selected
        console.log("Selected topic:", option);
    };

    const handleGeneratePrompts = () => {
        const formData = {
            topic,
            intention,
            theme: autoTheme ? "Auto Trending Theme" : theme,
            autoTheme,
            instructions
        };

        console.log("Form Data:", JSON.stringify(formData, null, 2));
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
                            <Switch checked={autoTheme} onCheckedChange={setAutoTheme} />
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
                    <Button className="w-full" onClick={handleGeneratePrompts}>Generate Prompts</Button>
                </div>
            </CardContent>
        </Card>
    );
}
