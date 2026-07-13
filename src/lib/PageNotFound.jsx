import { Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function PageNotFound() {
  const location = useLocation();

  return (
    <main
      className="min-h-screen bg-background px-5 py-16 text-foreground flex items-center justify-center"
      dir="rtl"
    >
      <section className="glass-surface w-full max-w-md rounded-3xl p-7 text-center space-y-5" role="alert">
        <p className="text-7xl font-black text-primary/25" aria-hidden="true">404</p>
        <div className="space-y-2">
          <h1 className="text-2xl font-black">העמוד לא נמצא</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            הכתובת <bdi className="font-mono text-foreground">{location.pathname}</bdi> אינה קיימת ביומן.
          </p>
        </div>
        <Link
          to="/"
          replace
          className="btn-3d inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 font-bold text-primary-foreground"
        >
          <Home className="size-5" aria-hidden="true" />
          חזרה למסך הראשי
        </Link>
      </section>
    </main>
  );
}
