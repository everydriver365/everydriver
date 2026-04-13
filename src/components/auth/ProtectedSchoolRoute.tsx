import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useSchoolAuth } from "@/context/SchoolAuthContext";

export function ProtectedSchoolRoute({ children }: { children: React.ReactNode }) {
  const { user, isSchoolManager, loading } = useSchoolAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/school/login" replace />;

  if (!isSchoolManager) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center">
        <div className="text-6xl">🚫</div>
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">You don't have school manager permissions.</p>
        <a href="/" className="text-primary hover:underline">Return to homepage</a>
      </div>
    );
  }

  return <>{children}</>;
}
