"use client";

import { useToast } from "@/hooks/use-toast";

type ToastFn = ReturnType<typeof useToast>['toast'];

export function handleApiError(
    error: any, 
    toast: ToastFn, 
    fallbackMessages: { title: string, description?: string }
) {
    console.error(fallbackMessages.title, error);
    
    let message = error.message || "An unknown error occurred.";

    if (typeof message === 'string') {
        if (message.includes("429") || message.toLowerCase().includes("quota")) {
            toast({
                variant: "destructive",
                title: "Rate Limit Exceeded",
                description: "The AI is experiencing high demand. Please wait a moment and try again.",
            });
            return;
        }
        if (message.includes("404") || message.toLowerCase().includes("not found")) {
            toast({
                variant: "destructive",
                title: "Model Not Found",
                description: "The selected AI model is not available. It may be deprecated or incorrect.",
            });
            return;
        }
    }
    
    toast({
        variant: "destructive",
        title: fallbackMessages.title,
        description: fallbackMessages.description,
    });
}

    