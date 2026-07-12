import { base44 } from "@/api/base44Client";
import { LogIn, Moon, Sun } from "lucide-react";
import GoogleIcon from "@/components/GoogleIcon";
import { useTheme } from "@/hooks/useTheme";

export default function Login() {
  const { dark, toggle } = useTheme();
  const handleGoogle = () => {
    base44.auth.loginWithProvider("google", "/");
  };

  return (
    <div dir="rtl" className="relative min-h-screen flex items-center justify-center app-loader-bg px-4">
      <button
        type="button"
        onClick={toggle}
        aria-label={dark ? 'מעבר למצב בהיר' : 'מעבר למצב כהה'}
        title={dark ? 'מצב בהיר' : 'מצב כהה'}
        className="absolute left-4 top-[calc(1rem+env(safe-area-inset-top,0px))] h-10 w-10 rounded-full liquid-chip flex items-center justify-center text-muted-foreground"
      >
        {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>
      <div className="w-full max-w-md flex flex-col items-center">
        {/* Liquid Glass icon */}
        <div
          className="relative w-24 h-24 rounded-full flex items-center justify-center mb-8"
          style={{
            background: "linear-gradient(160deg, hsl(var(--card) / 0.75), hsl(var(--card) / 0.40))",
            backdropFilter: "blur(28px) saturate(1.9)",
            WebkitBackdropFilter: "blur(28px) saturate(1.9)",
            boxShadow:
              "0 0 0 1px rgb(var(--glass-border) / 0.35), inset 0 2px 0 rgb(var(--glass-border) / 0.65), inset 0 -2px 6px hsl(var(--primary) / 0.10), 0 0 32px hsl(var(--primary) / 0.25), 0 18px 40px -14px hsl(var(--primary) / 0.45)",
            animation: "loader-pop 0.6s cubic-bezier(0.34,1.56,0.64,1) both",
          }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{
              background: "linear-gradient(180deg, hsl(var(--accent)), hsl(var(--primary)))",
              boxShadow: "inset 0 1.5px 0 rgba(255,255,255,0.45), inset 0 -2px 4px rgba(0,0,0,0.25), 0 6px 18px -6px hsl(var(--primary) / 0.6)",
            }}
          >
            <LogIn className="w-8 h-8 text-white drop-shadow" aria-hidden="true" />
          </div>
        </div>

        {/* Wordmark */}
        <div className="text-center mb-8" style={{ animation: "loader-fade-up 0.7s 0.15s ease-out both" }}>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">ברוכים הבאים</h1>
          <p className="text-muted-foreground mt-2">התחברו כדי להמשיך ליומן שלכם</p>
        </div>

        {/* Glass card */}
        <div
          className="w-full rounded-3xl p-8 card-3d"
          style={{ animation: "loader-fade-up 0.7s 0.3s ease-out both" }}
        >
          <button
            onClick={handleGoogle}
            className="group w-full h-14 rounded-2xl flex items-center justify-center gap-3 text-base font-semibold text-foreground transition-all duration-200 active:scale-[0.98]"
            style={{
              background: "linear-gradient(160deg, hsl(var(--card) / 0.92), hsl(var(--card) / 0.65))",
              backdropFilter: "blur(20px) saturate(1.8)",
              WebkitBackdropFilter: "blur(20px) saturate(1.8)",
              boxShadow:
                "0 0 0 1px rgb(var(--glass-border) / 0.40), inset 0 1.5px 0 rgb(var(--glass-border) / 0.70), inset 0 -1px 0 rgba(0,0,0,0.05), 0 2px 4px rgba(10,20,45,0.06), 0 14px 32px -10px rgba(10,20,45,0.28)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow =
                "0 0 0 1px hsl(var(--primary) / 0.35), inset 0 1.5px 0 rgb(var(--glass-border) / 0.80), 0 4px 8px rgba(10,20,45,0.08), 0 20px 44px -12px hsl(var(--primary) / 0.40)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow =
                "0 0 0 1px rgb(var(--glass-border) / 0.40), inset 0 1.5px 0 rgb(var(--glass-border) / 0.70), inset 0 -1px 0 rgba(0,0,0,0.05), 0 2px 4px rgba(10,20,45,0.06), 0 14px 32px -10px rgba(10,20,45,0.28)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <GoogleIcon className="w-6 h-6 shrink-0" />
            התחברות עם Google
          </button>

          <p className="text-center text-xs text-muted-foreground mt-5">
            התחברות מאובטחת באמצעות חשבון Google שלכם
          </p>
        </div>
      </div>
    </div>
  );
}
