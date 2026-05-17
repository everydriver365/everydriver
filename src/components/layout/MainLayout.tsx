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

export function MainLayout({ children, hideFooter = false }: MainLayoutProps) {
  const whitelabel = isWhitelabelDomain();
  return (
    <div className="learner-app flex min-h-screen flex-col overflow-x-hidden bg-background">
      <Drive365Header />
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

