import { useState, useEffect } from "react";
import { TECH_QUOTES } from "./techQuotes";

interface ThemeGeneratingPopupProps {
    isVisible: boolean;
}

const ThemeGeneratingPopup = ({ isVisible }: ThemeGeneratingPopupProps) => {
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

export default ThemeGeneratingPopup;
