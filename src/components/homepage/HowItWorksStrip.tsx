import { Search, CalendarCheck, Car } from "lucide-react";

const steps = [
  {
    n: "01",
    icon: Search,
    title: "Search your postcode",
    body: "See every DVSA-approved instructor in your area with live availability.",
  },
  {
    n: "02",
    icon: CalendarCheck,
    title: "Book in seconds",
    body: "Pick a course, pay your way — card, Klarna or Clearpay. No phone calls.",
  },
  {
    n: "03",
    icon: Car,
    title: "Start driving",
    body: "Your instructor picks you up. Free re-test if you don't pass first time.",
  },
];

export function HowItWorksStrip() {
  return (
    <section className="bg-card py-10 sm:py-14">
      <div className="container">
        <div className="mb-6 sm:mb-10 text-center">
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary mb-2">
            How it works
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">
            Find an instructor in 3 steps
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {steps.map(({ n, icon: Icon, title, body }, i) => (
            <div
              key={n}
              className="relative rounded-2xl border border-border/60 bg-background p-5 sm:p-6"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground flex-shrink-0">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-bold tracking-wider text-muted-foreground mb-1">
                    STEP {n}
                  </div>
                  <h3 className="text-base font-bold text-foreground mb-1.5">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-snug">{body}</p>
                </div>
              </div>
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-3 h-px w-6 bg-border" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
