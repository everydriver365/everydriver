import { Header } from "./Header";
import { Footer } from "./Footer";
import { MobileBottomNav } from "./MobileBottomNav";
import { LiveChatWidget } from "@/components/live-chat/LiveChatWidget";

interface MainLayoutProps {
  children: React.ReactNode;
  hideFooter?: boolean;
}

export function MainLayout({ children, hideFooter = false }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <Header />
      <main className="flex-1 pb-20 md:pb-0 overflow-x-hidden">{children}</main>
      {!hideFooter && <Footer />}
      <MobileBottomNav />
      <LiveChatWidget sessionType="admin" />
    </div>
  );
}
