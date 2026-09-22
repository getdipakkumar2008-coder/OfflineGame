import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/** A game engine crash must not take down the whole React app. */
export class GameErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Offline game crashed:", error, info.componentStack);
  }

  private handleReload = (): void => {
    this.setState({ hasError: false });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="game-overlay" role="alert">
          <p className="game-overlay__title">Something went wrong</p>
          <p className="game-overlay__subtitle">The offline game hit an error.</p>
          <button type="button" className="game-overlay__button" onClick={this.handleReload}>
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
