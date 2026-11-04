import React from 'react';

type Props = { children: React.ReactNode; title?: string };
type State = { hasError: boolean; message: string };

/** Keeps a single faulty screen from blanking the complete payroll app. */
export class ScreenErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, message: error instanceof Error ? error.message : String(error) };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Royal Hires screen render error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <section role="alert" className="mx-auto max-w-xl m-4 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-slate-800">
          <h2 className="text-lg font-bold">This screen could not be loaded</h2>
          <p className="mt-2 text-sm">The rest of Royal Hires is still available. Please return to Dashboard and reopen this screen.</p>
          <details className="mt-3 text-xs"><summary>Technical details</summary><pre className="mt-2 whitespace-pre-wrap break-words">{this.state.message}</pre></details>
          <button className="mt-4 rounded-lg bg-emerald-800 px-4 py-2 text-white" onClick={() => this.setState({ hasError: false, message: '' })}>Try again</button>
        </section>
      );
    }
    return this.props.children;
  }
}
