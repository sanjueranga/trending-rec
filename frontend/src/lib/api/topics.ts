const MOCK_TOPICS = [
    "Fashion",
    "Education",
    "Technology",
    "Business",
    "Health",
    "Entertainment",
    "Art",
    "Travel",
    "Food",
    "Science",
    "Sports"
];

export interface TopicSuggestion {
    id: string;
    name: string;
    category?: string;
}

// Mock API function to search topics
export async function searchTopics(query: string): Promise<TopicSuggestion[]> {
    if (!query || query.length < 2) {
        return [];
    }

    // Filter topics based on the query
    const filteredTopics = MOCK_TOPICS
        .filter(topic =>
            topic.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 8) // Limit to 8 suggestions
        .map((topic, index) => ({
            id: `topic-${index}-${topic.replace(/\s+/g, '-').toLowerCase()}`,
            name: topic,
            // category: getCategoryForTopic(topic)
        }));

    return filteredTopics;
}

// Helper function to categorize topics
function getCategoryForTopic(topic: string): string {
    const techKeywords = ['AI', 'Development', 'Software', 'Data', 'Cloud', 'Cyber', 'Machine', 'Web', 'Mobile', 'Blockchain'];
    const businessKeywords = ['Marketing', 'Business', 'Sales', 'Finance', 'Management', 'Leadership', 'Strategy'];
    const educationKeywords = ['Education', 'Learning', 'Student', 'Curriculum', 'STEM', 'Language'];
    const healthKeywords = ['Health', 'Fitness', 'Medical', 'Wellness', 'Mental', 'Nutrition'];
    const creativeKeywords = ['Content', 'Design', 'Art', 'Video', 'Music', 'Creative', 'Photography'];
    const scienceKeywords = ['Science', 'Research', 'Environmental', 'Climate', 'Energy', 'Space', 'Bio'];

    if (techKeywords.some(keyword => topic.includes(keyword))) return 'Technology';
    if (businessKeywords.some(keyword => topic.includes(keyword))) return 'Business';
    if (educationKeywords.some(keyword => topic.includes(keyword))) return 'Education';
    if (healthKeywords.some(keyword => topic.includes(keyword))) return 'Health & Wellness';
    if (creativeKeywords.some(keyword => topic.includes(keyword))) return 'Creative & Arts';
    if (scienceKeywords.some(keyword => topic.includes(keyword))) return 'Science & Research';

    return 'General';
}