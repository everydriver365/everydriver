import { useState } from "react";
import { SchoolLayout } from "@/components/school/SchoolLayout";
import { useSchoolAuth } from "@/context/SchoolAuthContext";
import { useNavigate } from "react-router-dom";

export default function SchoolPortal() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const { signOut } = useSchoolAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/school/login");
  };

  const renderSection = () => {
    switch (activeSection) {
      case "dashboard":
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">School Dashboard</h2>
            <p className="text-muted-foreground">
              Welcome to your School Manager portal. Use the sidebar to navigate.
            </p>
          </div>
        );
      case "instructors":
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Instructors</h2>
            <p className="text-muted-foreground">Manage your school's instructors here.</p>
          </div>
        );
      case "bookings":
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Bookings</h2>
            <p className="text-muted-foreground">View and manage school bookings.</p>
          </div>
        );
      case "branding":
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Branding</h2>
            <p className="text-muted-foreground">Customize your school's branding and white-label settings.</p>
          </div>
        );
      case "finances":
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Finances</h2>
            <p className="text-muted-foreground">Financial overview and reports.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <SchoolLayout
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      onLogout={handleLogout}
    >
      {renderSection()}
    </SchoolLayout>
  );
}
