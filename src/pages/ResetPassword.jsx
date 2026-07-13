import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Loader2, AlertTriangle } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { resetTokenVault } from "@/lib/resetTokenVault";

export default function ResetPassword() {
  const [resetToken] = useState(() => resetTokenVault.get());

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("הסיסמאות לא תואמות");
      return;
    }
    setLoading(true);
    try {
      await base44.auth.resetPassword({ resetToken, newPassword });
      resetTokenVault.clear();
      window.location.href = "/login";
    } catch (err) {
      setError(err.message || "איפוס הסיסמה נכשל");
    } finally {
      setLoading(false);
    }
  };

  if (!resetToken) {
    return (
      <AuthLayout
        icon={AlertTriangle}
        title="קישור שגוי"
        subtitle="קישור איפוס הסיסמה חסר או לא תקין"
        footer={
          <Link to="/forgot-password" className="text-primary font-medium hover:underline">
            בקשו קישור חדש
          </Link>
        }
      >
        <p className="text-sm text-foreground text-center">
          הקישור שהשתמשתם בו אינו תקין. אנא בקשו קישור איפוס סיסמה חדש.
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={Lock}
      title="סיסמה חדשה"
      subtitle="הזינו את הסיסמה החדשה שלכם"
    >
      {error && (
        <div id="reset-password-error" role="alert" aria-live="assertive" className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">סיסמה חדשה</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              autoFocus
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="pl-10 h-12"
              aria-describedby={error ? 'reset-password-error' : undefined}
              aria-invalid={Boolean(error)}
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">אימות סיסמה</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10 h-12"
              aria-describedby={error ? 'reset-password-error' : undefined}
              aria-invalid={Boolean(error)}
              required
            />
          </div>
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              מאפס...
            </>
          ) : (
            "אפס סיסמה"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
