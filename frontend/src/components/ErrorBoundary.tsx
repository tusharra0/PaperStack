"use client";

import React from "react";

type State = { hasError: boolean; message?: string };

type Props = {
  children: React.ReactNode;
};

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: undefined };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error("React error boundary caught", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, message: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <span className="mt-0.5 font-semibold capitalize">error</span>
            <div className="flex-1">{this.state.message || "Something went wrong."}</div>
            <button
              aria-label="Dismiss"
              className="text-sm text-muted-foreground hover:text-foreground"
              onClick={this.handleReset}
            >
              �
            </button>
          </div>
          <button
            onClick={this.handleReset}
            className="mt-4 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
