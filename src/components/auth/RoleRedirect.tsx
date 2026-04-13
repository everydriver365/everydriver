import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Shield, Users, GraduationCap, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RoleInfo {
  role: string;
  label: string;
  path: string;
  icon: React.ElementType;
}

const ROLE_MAP: Record<string, RoleInfo> = {
  admin: { role: "admin", label: "Admin Portal", path: "/admin", icon: Shield },
  school_manager: { role: "school_manager", label: "School Manager", path: "/school/dashboard", icon: Building2 },
  moderator: { role: "moderator", label: "Moderator", path: "/admin", icon: Users },
  user: { role: "user", label: "User", path: "/", icon: GraduationCap },
};

export function RoleRedirect() {
  const navigate = useNavigate();
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoles = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/", { replace: true });
        return;
      }

      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const userRoles = (data ?? []).map((r) => r.role);

      if (userRoles.length === 0) {
        navigate("/", { replace: true });
        return;
      }

      if (userRoles.length === 1) {
        const info = ROLE_MAP[userRoles[0]];
        navigate(info?.path ?? "/", { replace: true });
        return;
      }

      setRoles(userRoles);
      setLoading(false);
    };

    fetchRoles();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Choose Portal</h1>
          <p className="text-muted-foreground mt-1">
            You have access to multiple portals
          </p>
        </div>
        <div className="space-y-3">
          {roles.map((role) => {
            const info = ROLE_MAP[role];
            if (!info) return null;
            const Icon = info.icon;
            return (
              <Button
                key={role}
                variant="outline"
                className="w-full h-16 justify-start gap-4 text-left"
                onClick={() => navigate(info.path, { replace: true })}
              >
                <Icon className="h-6 w-6 text-primary" />
                <div>
                  <div className="font-semibold">{info.label}</div>
                  <div className="text-xs text-muted-foreground">
                    Continue as {info.label}
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
