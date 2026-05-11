import { useNavigate } from "react-router-dom";
import { ChevronLeft, Sparkles, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useInstructorFeatureToggles, type FeatureToggles } from "@/hooks/useInstructorFeatureToggles";
import { useInstructorAuth } from "@/hooks/useInstructorAuth";

interface Props {
  toggleKey: keyof FeatureToggles;
  title: string;
  description: string;
  bullets: string[];
}

export function LabFeatureStub({ toggleKey, title, description, bullets }: Props) {
  const navigate = useNavigate();
  const { instructor } = useInstructorAuth();
  const { toggles, update, loading } = useInstructorFeatureToggles(instructor?.id);
  const enabled = toggles[toggleKey];

  return (
    <div className="instructor-portal min-h-screen bg-[#F4F7F6] pb-12">
      <header className="sticky top-0 z-10 bg-card/90 backdrop-blur border-b border-border/50">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="p-1.5 -ml-1.5 rounded-lg hover:bg-muted">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="text-base font-semibold flex-1">{title}</h1>
          <Badge variant="secondary" className="text-[10px] uppercase">Beta</Badge>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-4 space-y-4">
        <div className="rounded-2xl bg-card border border-border/50 p-5 text-center">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-primary/10 text-primary grid place-items-center">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="mt-3 text-lg font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>

          {!enabled && !loading && (
            <Button
              className="mt-4"
              onClick={() => update({ [toggleKey]: true } as Partial<FeatureToggles>)}
            >
              Enable {title}
            </Button>
          )}
          {enabled && (
            <p className="mt-4 text-xs text-emerald-600 font-medium">Enabled — full experience coming soon.</p>
          )}
        </div>

        <div className="rounded-2xl bg-card border border-border/50 p-5">
          <h3 className="text-sm font-semibold mb-3">What it'll do</h3>
          <ul className="space-y-2">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-2 text-sm">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span className="text-foreground/80">{b}</span>
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={() => navigate("/instructor/settings/lab-features")}
          className="w-full rounded-2xl bg-card border border-border/50 p-4 flex items-center gap-3 text-left hover:bg-muted/50 transition"
        >
          <Settings className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm flex-1">Manage all Lab features</span>
          <span className="text-xs text-muted-foreground">→</span>
        </button>
      </main>
    </div>
  );
}
