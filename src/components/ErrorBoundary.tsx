"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="p-8 bg-black min-h-screen text-white flex flex-col items-center justify-center text-center">
                    <h1 className="text-3xl font-bold text-red-500 mb-4">CRASH DETECTED</h1>
                    <div className="bg-zinc-900 border border-red-500/50 p-6 rounded-lg max-w-lg w-full">
                        <p className="font-mono text-sm text-red-200 mb-4 break-words">
                            {this.state.error?.message || "Unknown error"}
                        </p>
                        <div className="flex gap-4 justify-center">
                            <Button
                                variant="default"
                                className="bg-red-600 hover:bg-red-700"
                                onClick={() => window.location.reload()}
                            >
                                Reload Page
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => window.location.href = '/'}
                            >
                                Go Home
                            </Button>
                        </div>
                    </div>
                    <p className="text-zinc-600 mt-8 text-xs">
                        Please screenshot this screen and share it with support.
                    </p>
                </div>
            );
        }

        return this.props.children;
    }
}
