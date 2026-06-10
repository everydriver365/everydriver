import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Circle, ExternalLink, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Props {
  instructorId: string;
}

interface ChecklistState {
  hasProfileImage: boolean;
  hasWorkingHours: boolean;
  hasSlug: boolean;
  slug: string | null;
  hasPupil: boolean;
  hasLesson: boolean;
  loaded: boolean;
}

const initial: ChecklistState = {
  hasProfileImage: false,
  hasWorkingHours: false,
  hasSlug: false,
  slug: null,
  hasPupil: false,
  hasLesson: false,
  loaded: false,
};

export function GettingStartedChecklist({ instructorId }: Props) {
  const [state, setState] = useState<ChecklistState>(initial);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!instructorId) return;
    let cancelled = false;

    const load = async () => {
      const [instructorRes, hoursRes, pupilsRes, lessonsRes] = await Promise.all([
        supabase
          .from("instructors")
          .select("profile_image_url, app_slug")
          .eq("id", instructorId)
          .maybeSingle(),
        supabase
          .from("instructor_working_hours")
          .select("id", { count: "exact", head: true })
          .eq("instructor_id", instructorId),
        supabase
          .from("pupils")
          .select("id", { count: "exact", head: true })
          .eq("instructor_id", instructorId)
          .is("deleted_at", null),
        supabase
          .from("scheduled_lessons")
          .select("id", { count: "exact", head: true })
          .eq("instructor_id", instructorId),
      ]);

      if (cancelled) return;
      const slug = instructorRes.data?.app_slug ?? null;
      setState({
        hasProfileImage: !!instructorRes.data?.profile_image_url,
        hasWorkingHours: (hoursRes.count ?? 0) > 0,
        hasSlug: !!slug,
        slug,
        hasPupil: (pupilsRes.count ?? 0) > 0,
        hasLesson: (lessonsRes.count ?? 0) > 0,
        loaded: true,
      });
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [instructorId]);

  if (!state.loaded || dismissed) return null;
  // Hide once any lessons exist
  if (state.hasLesson) return null;
  // Also hide if pupils already added (real usage started)
  if (state.hasPupil && state.hasWorkingHours && state.hasProfileImage) return null;

  const items = [
    { done: true, label: "Account created" },
    {
      done: state.hasProfileImage,
      label: "Add your profile photo",
      href: "/instructor/profile",
    },
    {
      done: state.hasWorkingHours,
      label: "Set your working hours",
      href: "/instructor/availability",
    },
    {
      done: state.hasSlug,
      label: "Your mini website is live — view it",
      href: state.slug ? `https://everydriver.co.uk/i/${state.slug}` : undefined,
      external: true,
    },
    {
      done: false,
      label: "Share your booking link",
      href: "/instructor/marketing",
    },
    {
      done: state.hasPupil,
      label: "Add your first pupil",
      href: "/instructor/pupils",
    },
  ];

  return (
    <Card className="mb-4 border-primary/20 bg-primary/5">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base">Getting started</CardTitle>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-2 pb-4">
        {items.map((item, i) => {
          const Icon = item.done ? CheckCircle2 : Circle;
          const content = (
            <div className="flex items-center gap-2 py-1.5">
              <Icon
                className={`h-4 w-4 shrink-0 ${
                  item.done ? "text-success" : "text-muted-foreground"
                }`}
              />
              <span
                className={`text-sm flex-1 ${
                  item.done ? "text-muted-foreground line-through" : "text-foreground"
                }`}
              >
                {item.label}
              </span>
              {item.href && !item.done && item.external && (
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </div>
          );

          if (!item.href || item.done) {
            return <div key={i}>{content}</div>;
          }
          if (item.external) {
            return (
              <a
                key={i}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="block hover:bg-background/60 rounded-md px-2 -mx-2 transition"
              >
                {content}
              </a>
            );
          }
          return (
            <Link
              key={i}
              to={item.href}
              className="block hover:bg-background/60 rounded-md px-2 -mx-2 transition"
            >
              {content}
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
