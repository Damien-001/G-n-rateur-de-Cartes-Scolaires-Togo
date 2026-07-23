import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: string;
}

export class ErrorBoundary extends React.Component<Props, State> {
  props: Props;
  state: State = {
    hasError: false,
    error: '',
  };

  constructor(props: Props) {
    super(props);
    this.props = props;
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-lg border border-red-100 p-8 max-w-md w-full">
            <div className="text-4xl mb-4">💥</div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Une erreur est survenue</h2>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700 font-mono break-all mb-4">
              {this.state.error}
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Ouvre la console du navigateur (F12) pour plus de détails.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-2 btn-primary"
            >
              Recharger la page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
