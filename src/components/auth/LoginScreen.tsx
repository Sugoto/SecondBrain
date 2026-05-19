import { useEffect, useState } from "react";
import { Brain } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const CURRENT_YEAR = new Date().getFullYear();

function readOAuthErrorFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;
  if (!hash || !hash.includes("error")) return null;
  const params = new URLSearchParams(hash);
  const description = params.get("error_description");
  const code = params.get("error");
  if (!description && !code) return null;
  window.history.replaceState(null, "", window.location.pathname);
  return description ? description.replace(/\+/g, " ") : code;
}

export function LoginScreen() {
  const { signInWithGoogle } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const urlError = readOAuthErrorFromUrl();
    if (urlError) setError(urlError);
  }, []);

  const handleGoogleSignIn = async () => {
    setSubmitting(true);
    setError(null);
    const { error } = await signInWithGoogle();
    if (error) {
      setError(error);
      setSubmitting(false);
    }
  };

  return (
    <div className="h-[100dvh] w-full bg-background flex flex-col px-6">
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm mx-auto">
        <Brain
          className="h-9 w-9 text-foreground mb-10"
          strokeWidth={1.25}
        />

        <p className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground mb-3">
          SecondBrain
        </p>

        <h1 className="font-heading text-[44px] tracking-[-0.03em] leading-[1.05] text-foreground text-center mb-4">
          A quieter way to track your life.
        </h1>

        <p className="text-[13px] text-muted-foreground/80 text-center max-w-[24ch] mb-12">
          Fitness, finance, and study in one minimal place.
        </p>

        <div className="w-full">
          {error && (
            <p
              className="text-[12px] text-destructive border border-destructive/30 rounded-md px-3 py-2.5 mb-4"
              role="alert"
            >
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={submitting}
            className="w-full h-12 flex items-center justify-center gap-3 bg-foreground text-background text-[11px] uppercase tracking-[0.22em] rounded-lg transition-opacity active:opacity-90 disabled:opacity-30"
          >
            <GoogleIcon className="h-4 w-4" />
            {submitting ? "Redirecting" : "Continue with Google"}
          </button>
        </div>
      </div>

      <footer className="shrink-0 text-center pb-8 pt-4">
        <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground/70">
          {CURRENT_YEAR}
          <span className="mx-2 text-muted-foreground/30">·</span>
          <span className="text-muted-foreground">Sugoto Basu</span>
        </p>
      </footer>
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.92h5.45c-.24 1.4-1.7 4.1-5.45 4.1-3.28 0-5.96-2.72-5.96-6.06s2.68-6.06 5.96-6.06c1.87 0 3.12.8 3.84 1.48l2.62-2.52C16.78 3.46 14.6 2.5 12 2.5 6.76 2.5 2.5 6.76 2.5 12S6.76 21.5 12 21.5c6.92 0 9.5-4.86 9.5-7.4 0-.5-.05-.88-.12-1.26H12z"
      />
      <path
        fill="#4285F4"
        d="M21.38 12.84c0-.5-.05-.88-.12-1.26H12v3.92h5.45c-.22 1.32-1.5 3.84-5.45 3.84v.04c3.42 0 6.34-2.32 7.5-5.46l-.12-1.08z"
      />
      <path
        fill="#FBBC05"
        d="M5.6 14.32a5.96 5.96 0 0 1 0-4.64L2.92 7.6A9.5 9.5 0 0 0 2.5 12c0 1.54.36 3 .98 4.28l2.62-2.52z"
      />
      <path
        fill="#34A853"
        d="M12 21.5c2.6 0 4.78-.86 6.36-2.34l-2.94-2.28c-.78.54-1.84.92-3.42.92-2.62 0-4.84-1.74-5.64-4.16L2.92 16.4C4.5 19.46 7.94 21.5 12 21.5z"
      />
    </svg>
  );
}
