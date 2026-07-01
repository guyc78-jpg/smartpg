import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('App error boundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 flex items-center justify-center bg-background p-4" dir="rtl">
          <div className="text-center space-y-4 max-w-sm">
            <AlertTriangle className="w-10 h-10 text-destructive mx-auto" />
            <h2 className="text-lg font-bold">משהו השתבש</h2>
            <p className="text-sm text-muted-foreground">אירעה שגיאה בלתי צפויה. נסה לרענן את הדף.</p>
            <Button onClick={() => window.location.reload()} className="w-full h-11 rounded-xl font-semibold">
              רענן דף
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}