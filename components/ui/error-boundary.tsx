"use client";

import React from "react";

type ErrorBoundaryProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

type ErrorBoundaryState = { hasError: boolean };

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("Client component error:", error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div role="status" aria-live="polite" className="rounded-md border bg-muted/50 p-4 text-sm">
          Something went wrong. Please reload the page.
        </div>
      );
    }
    return this.props.children;
  }
}

