import { useLocation, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Search, MapPin, Home, BookOpen, HelpCircle, Phone, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouteLogo } from "@/hooks/useRouteLogo";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [postcode, setPostcode] = useState("");

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  const isInstructorPath = location.pathname.startsWith("/instructor");
  const isPupilPath = location.pathname.startsWith("/pupil");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (postcode.trim()) {
      navigate(`/courses?postcode=${encodeURIComponent(postcode.trim())}`);
    }
  };

  const suggestedLinks = [
    { label: "Home", icon: Home, path: "/drive365" },
    { label: "Browse Courses", icon: BookOpen, path: "/courses" },
    { label: "FAQs", icon: HelpCircle, path: "/faqs" },
    { label: "Contact Us", icon: Phone, path: "/contact" },
  ];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-md text-center">
        <Link to="/drive365" className="inline-block mb-8">
          <img src={drive365Logo} alt="Drive365" className="h-10 mx-auto" />
        </Link>

        <h1 className="text-7xl font-black text-primary mb-2">404</h1>
        <h2 className="text-xl font-semibold text-foreground mb-2">Page not found</h2>
        <p className="text-muted-foreground mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Postcode search */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex items-center rounded-full border border-border bg-card px-3 py-1.5">
            <MapPin className="h-4 w-4 text-muted-foreground mr-2 shrink-0" />
            <Input
              type="text"
              placeholder="Find courses by postcode"
              value={postcode}
              onChange={(e) => setPostcode(e.target.value)}
              className="h-9 border-0 bg-transparent p-0 text-sm placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <Button type="submit" size="sm" className="rounded-full px-4 ml-2 shrink-0">
              <Search className="h-4 w-4 mr-1" />
              Search
            </Button>
          </div>
        </form>

        {/* Suggested links */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {suggestedLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className="flex items-center gap-2 rounded-xl border border-border bg-card p-3 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <link.icon className="h-4 w-4 text-primary" />
              {link.label}
            </Link>
          ))}
        </div>

        {/* Context-aware login links */}
        {(isInstructorPath || isPupilPath) && (
          <div className="rounded-xl border border-border bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground mb-3">Looking to log in?</p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" size="sm" asChild>
                <Link to="/instructor-app/login">
                  <LogIn className="h-4 w-4 mr-1" />
                  Instructor Login
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/pupil/login">
                  <LogIn className="h-4 w-4 mr-1" />
                  Pupil Login
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotFound;
