import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Shield, Users, GraduationCap, Building2, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { bootProbeLog } from "@/lib/bootProbe";

interface RoleInfo {
  role: string;
  label: string;
  path: string;
  icon: React.ElementType;
}

const ROLE_MAP: Record<string, RoleInfo> = {
  admin: { role: "admin", label: "Admin Portal", path: "/admin", icon: Shield },
  school_manager: { role: "school_manager", label: "School Manager", path: "/school/dashboard", icon: Building2 },
  instructor: { role: "instructor", label: "Instructor Portal", path: "/instructor", icon: Car },
  pupil: { role: "pupil", label: "Pupil Portal", path: "/pupil", icon: GraduationCap },
  parent: { role: "parent", label: "Parent Portal", path: "/parent", icon: Users },
  moderator: { role: "moderator", label: "Moderator", path: "/admin", icon: Users },
  user: { role: "user", label: "User", path: "/", icon: GraduationCap },
};

// Role precedence when no explicit hint and user has multiple roles auto-routed.
const ROLE_PRIORITY = ["admin", "school_manager", "instructor", "pupil", "parent", "moderator", "user"];

async function resolvePupilPath(userId: string): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  const email = user?.email;
  if (!email) return "/pupil";
  const { data } = await supabase
    .from("pupils")
    .select("instructor_id, instructors:instructor_id(app_slug)")
    .eq("email", email)
    .maybeSingle();
  const slug = (data as any)?.instructors?.app_slug;
  return slug ? `/p/${slug}` : "/pupil";
}

export function RoleRedirect() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const hint = searchParams.get("portal"); // optional: admin|instructor|pupil|school
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Hard timeout fallback — never spin forever. Default to instructor portal.
  useEffect(() => {
    const t = setTimeout(() => {
      console.warn("[RoleRedirect] timeout — falling back to /instructor");
      navigate("/instructor", { replace: true });
    }, 5000);
    return () => clearTimeout(t);
  }, [navigate]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      bootProbeLog("RoleRedirect: getUser…");
      let user: any = null;
      try {
        const res = await supabase.auth.getUser();
        user = res.data.user;
        bootProbeLog(`RoleRedirect: getUser ok user=${user?.id ? "yes" : "no"}`);
      } catch (e: any) {
        bootProbeLog(`RoleRedirect: getUser FAILED ${e?.message || e}`);
        console.error("[RoleRedirect] getUser failed", e);
      }
      if (cancelled) return;
      if (!user) {
        bootProbeLog("RoleRedirect: no user → /");
        navigate("/", { replace: true });
        return;
      }

      bootProbeLog("RoleRedirect: query user_roles…");
      let userRoles: string[] = [];
      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);
        if (error) bootProbeLog(`user_roles err ${error.message}`);
        userRoles = (data ?? []).map((r) => r.role as string);
        bootProbeLog(`RoleRedirect: roles=[${userRoles.join(",")}]`);
      } catch (e: any) {
        bootProbeLog(`RoleRedirect: user_roles THREW ${e?.message || e}`);
        console.error("[RoleRedirect] user_roles query failed", e);
      }
      if (cancelled) return;

      const goTo = async (role: string) => {
        if (role === "pupil") {
          try {
            const path = await resolvePupilPath(user.id);
            navigate(path, { replace: true });
          } catch {
            navigate("/pupil", { replace: true });
          }
          return;
        }
        const info = ROLE_MAP[role];
        navigate(info?.path ?? "/instructor", { replace: true });
      };

      // Honour explicit portal hint when the user has that role.
      const hintMap: Record<string, string> = {
        admin: "admin",
        school: "school_manager",
        school_manager: "school_manager",
        instructor: "instructor",
        pupil: "pupil",
        parent: "parent",
      };
      if (hint && hintMap[hint] && userRoles.includes(hintMap[hint])) {
        await goTo(hintMap[hint]);
        return;
      }

      if (userRoles.length === 0) {
        // No role row — try pupil-by-email, otherwise fall back to instructor.
        try {
          const path = await resolvePupilPath(user.id);
          if (path && path !== "/pupil") {
            navigate(path, { replace: true });
            return;
          }
        } catch { /* ignore */ }
        navigate("/instructor", { replace: true });
        return;
      }

      if (userRoles.length === 1) {
        await goTo(userRoles[0]);
        return;
      }

      const auto = ROLE_PRIORITY.find((r) => userRoles.includes(r));
      if (auto) {
        await goTo(auto);
        return;
      }

      setRoles(userRoles);
      setLoading(false);
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [navigate, hint]);


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
                onClick={async () => {
                  if (role === "pupil") {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                      const path = await resolvePupilPath(user.id);
                      navigate(path, { replace: true });
                      return;
                    }
                  }
                  navigate(info.path, { replace: true });
                }}
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
