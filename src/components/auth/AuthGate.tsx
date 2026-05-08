import type { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { LoginScreen } from "./LoginScreen";

export function AuthGate({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) {
    return <div className="h-[100dvh] w-full bg-background" />;
  }

  if (!session) {
    return <LoginScreen />;
  }

  return <>{children}</>;
}
