import { motion } from "framer-motion";
import { Shield, ShieldCheck, Award, CreditCard, CheckCircle2, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import logoClearpay from "@/assets/logo-clearpay.webp";
import logoKlarna from "@/assets/logo-klarna.png";
import logoAdiCode from "@/assets/logo-adi-code.jpg";
import logoMsa from "@/assets/logo-msa.jpg";
import logoCpd from "@/assets/logo-cpd.jpg";
import logoCardPayments from "@/assets/logo-card-payments.png";

const certLogos = [
  { src: logoAdiCode, alt: "ADI Code of Practice" },
  { src: logoMsa, alt: "MSA GB Member" },
  { src: logoCpd, alt: "CPD Certified" },
];
const payLogos = [
  { src: logoCardPayments, alt: "Visa, MasterCard, Maestro" },
  { src: logoKlarna, alt: "Klarna" },
  { src: logoClearpay, alt: "Clearpay" },
];

function Wrapper({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-border">
      <div className="container max-w-6xl pt-8 pb-2">
        <Badge variant="outline" className="text-xs mb-2">{id}</Badge>
        <h2 className="text-xl font-bold text-foreground mb-4">{title}</h2>
      </div>
      {children}
    </section>
  );
}

// V1 — Simple centered row with divider
function V1() {
  return (
    <Wrapper id="V1" title="Clean Row + Divider">
      <div className="border-t bg-muted/30 py-6">
        <div className="container flex items-center justify-center gap-8 flex-wrap">
          {certLogos.map(l => <img key={l.alt} src={l.src} alt={l.alt} className="h-10 object-contain opacity-70 hover:opacity-100 transition-opacity" />)}
          <div className="h-8 w-px bg-border" />
          {payLogos.map(l => <img key={l.alt} src={l.src} alt={l.alt} className="h-7 object-contain opacity-70 hover:opacity-100 transition-opacity" />)}
        </div>
      </div>
    </Wrapper>
  );
}

// V2 — Cards with labels
function V2() {
  return (
    <Wrapper id="V2" title="Logo Cards with Labels">
      <div className="bg-secondary/30 py-8">
        <div className="container">
          <p className="text-center text-xs uppercase tracking-widest text-muted-foreground mb-6">Trusted & Certified</p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            {[...certLogos, ...payLogos].map(l => (
              <div key={l.alt} className="flex flex-col items-center gap-2 bg-card rounded-xl border border-border p-4 min-w-[100px]">
                <img src={l.src} alt={l.alt} className="h-8 object-contain" />
                <span className="text-[10px] text-muted-foreground text-center leading-tight">{l.alt}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Wrapper>
  );
}

// V3 — Dark bar, full-width
function V3() {
  return (
    <Wrapper id="V3" title="Dark Full-Width Bar">
      <div className="bg-foreground py-6">
        <div className="container flex items-center justify-center gap-10 flex-wrap">
          {[...certLogos, ...payLogos].map(l => (
            <img key={l.alt} src={l.src} alt={l.alt} className="h-9 object-contain brightness-0 invert opacity-60 hover:opacity-100 transition-opacity" />
          ))}
        </div>
      </div>
    </Wrapper>
  );
}

// V4 — Two groups with headings
function V4() {
  return (
    <Wrapper id="V4" title="Two Groups with Headings">
      <div className="bg-muted/20 py-8">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Accreditations</span>
              </div>
              <div className="flex items-center justify-center gap-6">
                {certLogos.map(l => <img key={l.alt} src={l.src} alt={l.alt} className="h-10 object-contain" />)}
              </div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <CreditCard className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Payment Options</span>
              </div>
              <div className="flex items-center justify-center gap-6">
                {payLogos.map(l => <img key={l.alt} src={l.src} alt={l.alt} className="h-8 object-contain" />)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Wrapper>
  );
}

// V5 — Marquee / scrolling logos
function V5() {
  const all = [...certLogos, ...payLogos, ...certLogos, ...payLogos];
  return (
    <Wrapper id="V5" title="Marquee Scroll">
      <div className="bg-muted/30 py-6 overflow-hidden relative">
        <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-muted/30 to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-muted/30 to-transparent z-10" />
        <motion.div
          className="flex items-center gap-12"
          animate={{ x: [0, -400] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          {all.map((l, i) => (
            <img key={`${l.alt}-${i}`} src={l.src} alt={l.alt} className="h-9 object-contain shrink-0 opacity-60" />
          ))}
        </motion.div>
      </div>
    </Wrapper>
  );
}

// V6 — Gradient banner with icons + logos
function V6() {
  return (
    <Wrapper id="V6" title="Gradient Banner">
      <div className="bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 py-8 border-y border-border">
        <div className="container">
          <div className="flex items-center justify-between max-w-4xl mx-auto flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Fully Accredited</span>
            </div>
            <div className="flex items-center gap-6">
              {certLogos.map(l => <img key={l.alt} src={l.src} alt={l.alt} className="h-9 object-contain" />)}
            </div>
            <div className="h-8 w-px bg-border hidden md:block" />
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Secure Payments</span>
            </div>
            <div className="flex items-center gap-5">
              {payLogos.map(l => <img key={l.alt} src={l.src} alt={l.alt} className="h-7 object-contain" />)}
            </div>
          </div>
        </div>
      </div>
    </Wrapper>
  );
}

// V7 — Pill badges with logos inline
function V7() {
  return (
    <Wrapper id="V7" title="Pill Badges">
      <div className="py-6 bg-muted/20">
        <div className="container flex items-center justify-center gap-3 flex-wrap">
          {certLogos.map(l => (
            <div key={l.alt} className="inline-flex items-center gap-2 bg-card border border-border rounded-full px-4 py-2">
              <img src={l.src} alt={l.alt} className="h-6 object-contain" />
              <span className="text-xs font-medium text-foreground">{l.alt.split(' ').slice(0, 2).join(' ')}</span>
            </div>
          ))}
          <div className="h-6 w-px bg-border mx-1" />
          {payLogos.map(l => (
            <div key={l.alt} className="inline-flex items-center gap-2 bg-card border border-border rounded-full px-4 py-2">
              <img src={l.src} alt={l.alt} className="h-5 object-contain" />
            </div>
          ))}
        </div>
      </div>
    </Wrapper>
  );
}

// V8 — Minimal line with "Trusted by" text
function V8() {
  return (
    <Wrapper id="V8" title="Minimal with Trust Text">
      <div className="py-8">
        <div className="container max-w-3xl">
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs uppercase tracking-widest text-muted-foreground whitespace-nowrap">Certified & Secure</span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <div className="flex items-center justify-center gap-8 mt-6 flex-wrap">
            {[...certLogos, ...payLogos].map(l => (
              <motion.img key={l.alt} src={l.src} alt={l.alt} className="h-8 object-contain grayscale hover:grayscale-0 transition-all duration-300" whileHover={{ scale: 1.1 }} />
            ))}
          </div>
        </div>
      </div>
    </Wrapper>
  );
}

// V9 — Stacked compact (mobile-friendly)
function V9() {
  return (
    <Wrapper id="V9" title="Stacked Compact">
      <div className="bg-card border-y border-border py-6">
        <div className="container max-w-2xl space-y-4">
          <div className="flex items-center justify-center gap-6">
            {certLogos.map(l => (
              <div key={l.alt} className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <img src={l.src} alt={l.alt} className="h-8 object-contain" />
              </div>
            ))}
          </div>
          <div className="h-px bg-border" />
          <div className="flex items-center justify-center gap-6">
            <span className="text-xs text-muted-foreground">Pay with</span>
            {payLogos.map(l => <img key={l.alt} src={l.src} alt={l.alt} className="h-6 object-contain" />)}
          </div>
        </div>
      </div>
    </Wrapper>
  );
}

// V10 — Glass card centered
function V10() {
  return (
    <Wrapper id="V10" title="Glass Card">
      <div className="py-10 bg-gradient-to-b from-primary/5 to-background">
        <div className="container max-w-2xl">
          <div className="bg-card/80 backdrop-blur border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-center gap-2 mb-5">
              <Award className="h-4 w-4 text-accent" />
              <span className="text-sm font-semibold">Accredited & Secure</span>
            </div>
            <div className="flex items-center justify-center gap-6 flex-wrap">
              {[...certLogos, ...payLogos].map(l => (
                <img key={l.alt} src={l.src} alt={l.alt} className="h-8 object-contain opacity-80 hover:opacity-100 transition-opacity" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </Wrapper>
  );
}

export default function DemoTrustBadges() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl py-12">
        <h1 className="text-4xl font-bold mb-2">Trust Badge Variants</h1>
        <p className="text-muted-foreground mb-4">10 designs for the logo/trust bar section</p>
      </div>
      <V1 /><V2 /><V3 /><V4 /><V5 /><V6 /><V7 /><V8 /><V9 /><V10 />
    </div>
  );
}
