import { useLocation } from "react-router-dom";
import { Header } from "./Header";
import { Drive365Header } from "./Drive365Header";
import { Footer } from "./Footer";
import { MobileBottomNav } from "./MobileBottomNav";
import { WhitelabelBottomNav } from "./WhitelabelBottomNav";
import { BackToTopButton } from "./BackToTopButton";
import { WhatsAppChatWidget } from "@/components/whatsapp/WhatsAppChatWidget";
import { Drive365MarketingHero } from "@/components/homepage/Drive365MarketingHero";
import { isWhitelabelDomain } from "@/lib/whitelabel";

interface MainLayoutProps {
  children: React.ReactNode;
  hideFooter?: boolean;
}

// Routes that should use the white Drive 365 header instead of the legacy navy bar.
const DRIVE365_HEADER_ROUTES = ["/courses"];

export function MainLayout({ children, hideFooter = false }: MainLayoutProps) {
  const whitelabel = isWhitelabelDomain();
  const { pathname } = useLocation();
  const useDrive365Header = DRIVE365_HEADER_ROUTES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  return (
    <div className="learner-app flex min-h-screen flex-col overflow-x-hidden bg-background">
      {useDrive365Header ? <Drive365Header /> : <Header />}
      <main className="flex-1 pb-20 md:pb-0 overflow-x-hidden">
        <Drive365MarketingHero />
        {children}
      </main>
      {!hideFooter && <Footer />}
      {whitelabel ? <WhitelabelBottomNav /> : <MobileBottomNav />}
      <BackToTopButton />
      <WhatsAppChatWidget />
    </div>
  );
}

