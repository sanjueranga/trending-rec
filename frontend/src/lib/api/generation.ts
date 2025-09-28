const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api/backend';

export interface GenerateRequest {
    topic: string;
    intention: string;
    theme: string;
    content?: string;
}

export interface GenerateResponse {
    response: string[];
}

export interface ErrorResponse {
    status: string;
    message: string;
    details?: Record<string, unknown>;
}

export class ApiError extends Error {
    constructor(
        message: string,
        public statusCode: number,
        public details?: Record<string, unknown>
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

export async function generatePrompts(request: GenerateRequest): Promise<string[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            mode: 'cors',
            credentials: 'same-origin',
            body: JSON.stringify(request),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            // Backend returns errors in 'detail' field, which can be nested
            const errorDetail = errorData.detail || errorData;
            throw new ApiError(
                errorDetail.message || errorData.message || `HTTP error! status: ${response.status}`,
                response.status,
                errorDetail.details || errorData.details
            );
        }

        const data: GenerateResponse = await response.json();
        return data.response;
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }

        // Handle network errors
        if (error instanceof TypeError && error.message.includes('fetch')) {
            throw new ApiError(
                'Unable to connect to the server. Please check your internet connection and try again.',
                0
            );
        }

        // Handle CORS errors
        if (error instanceof TypeError && error.message.includes('CORS')) {
            throw new ApiError(
                'Unable to connect to the server due to CORS policy. Please check server configuration.',
                0
            );
        }

        // Handle other errors
        throw new ApiError(
            error instanceof Error ? error.message : 'An unexpected error occurred',
            500
        );
    }
}

// Health check function
export async function checkApiHealth(): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE_URL.replace('/api', '')}/`, {
            method: 'GET',
            mode: 'cors',
            credentials: 'same-origin',
        });
        return response.ok;
    } catch {
        return false;
    }
}

// For future backend integration - trending themes endpoint
export async function fetchTrendingTheme(topic: string, intention: string): Promise<string | null> {
    // This is a placeholder for when the backend adds trending themes endpoint
    // For now, we'll keep using the frontend mock functionality
    console.log('Trending theme endpoint not yet implemented in backend for:', { topic, intention });
    return null;
}