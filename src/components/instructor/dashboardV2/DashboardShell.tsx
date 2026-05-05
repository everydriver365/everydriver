import { ReactNode, useEffect, useState } from "react";
import "./tokens.css";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardTopBar } from "./DashboardTopBar";

interface Props {
  userInitials: string;
  userName: string;
  notificationCount?: number;
  onSignOut: () => void;
  onAskED: () => void;
  onBell: () => void;
  rightRail?: ReactNode;
  children: ReactNode;
}

const SIDEBAR_KEY = "dsm.dashboard.sidebar";

export function DashboardShell({
  userInitials, userName, notificationCount, onSignOut, onAskED, onBell,
  rightRail, children,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem(SIDEBAR_KEY) === "1");
  }, []);

  const toggle = () => {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0");
      return next;
    });
  };

  return (
    <div className="dashboard-v2 instructor-portal min-h-screen flex" style={{ overflowX: "clip" }}>
      <DashboardSidebar
        collapsed={collapsed}
        onToggle={toggle}
        userInitials={userInitials}
        userName={userName}
        onSignOut={onSignOut}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardTopBar
          userInitials={userInitials}
          notificationCount={notificationCount}
          onAskED={onAskED}
          onBell={onBell}
        />
        <div className="flex-1 flex min-w-0">
          <main className="flex-1 min-w-0" style={{ padding: 24 }}>
            {children}
          </main>
          {rightRail}
        </div>
      </div>
    </div>
  );
}
