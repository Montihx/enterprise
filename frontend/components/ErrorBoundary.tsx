
'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * ErrorBoundary component to catch rendering errors in the component tree.
 */
// Fix: Using React.Component explicitly helps ensure TypeScript maps the standard React class structure (including 'props') correctly
export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to console as part of the diagnostic process
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    // Check if an error has occurred in the child component tree
    if (this.state.hasError) {
      // Display a fallback UI when an error occurs
      return (
        <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-4 text-center">
          <div className="p-6 bg-accent-danger/10 rounded-full mb-8">
            <AlertCircle className="w-16 h-16 text-accent-danger" />
          </div>
          <h1 className="text-4xl font-black text-white mb-4 tracking-tight">System Anomaly Detected</h1>
          <p className="text-text-muted mb-8 max-w-md mx-auto leading-relaxed">
            The neural interface experienced a critical fault. Please attempt a hard reset of the application state.
          </p>
          <Button 
            size="lg" 
            onClick={() => window.location.reload()}
            className="bg-accent-primary hover:bg-accent-primary/90 font-bold px-8"
          >
            <RotateCcw className="mr-2 h-5 w-5" /> Reload Interface
          </Button>
        </div>
      );
    }

    // Fix: 'this.props' is correctly accessible now that the component inheritance is properly recognized
    return this.props.children;
  }
}
