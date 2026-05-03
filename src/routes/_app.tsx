import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_app")({
  component: AuthGuard,
});

function AuthGuard() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) navigate({ to: "/login" });
  }, [isLoading, user, navigate]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-brass animate-spin" />
      </div>
    );
  }
  return <Outlet />;
}
