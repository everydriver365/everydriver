import { MainLayout } from "@/components/layout/MainLayout";
import { MessageCircle, Book, Video, FileText, Headphones } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const helpTopics = [
  {
    title: "Getting Started",
    description: "Learn how to book your first lesson and what to expect",
    icon: Book,
    link: "/faqs",
  },
  {
    title: "Video Tutorials",
    description: "Watch helpful guides on driving techniques",
    icon: Video,
    link: "#",
  },
  {
    title: "Theory Help",
    description: "Resources for passing your theory test",
    icon: FileText,
    link: "/theory",
  },
  {
    title: "Contact Support",
    description: "Speak with our friendly support team",
    icon: MessageCircle,
    link: "/contact",
  },
];

export default function Help() {
  const openLiveChat = () => {
    window.dispatchEvent(new CustomEvent("open-live-chat"));
  };

  return (
    <MainLayout>
      <div className="container py-8 pb-24">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <MessageCircle className="h-12 w-12 text-primary mx-auto mb-4" />
            <h1 className="text-3xl font-bold">Help Centre</h1>
            <p className="text-muted-foreground mt-2">
              We're here to help you on your journey to becoming a confident driver
            </p>
          </div>

          {/* Live Chat Tile */}
          <button
            onClick={openLiveChat}
            className="mb-6 w-full rounded-xl border-2 border-accent bg-accent/10 p-5 text-left transition-all hover:bg-accent/20 hover:shadow-md active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg">
                <Headphones className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Live Chat</h3>
                <p className="text-sm text-muted-foreground">
                  Chat with our support team in real-time — we're here to help!
                </p>
              </div>
            </div>
          </button>

          <div className="grid gap-4 sm:grid-cols-2">
            {helpTopics.map((topic) => (
              <Link key={topic.title} to={topic.link}>
                <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <topic.icon className="h-5 w-5 text-primary" />
                      </div>
                      {topic.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">{topic.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="mt-8 p-6 rounded-2xl bg-primary text-primary-foreground text-center">
            <h2 className="text-xl font-semibold">Still need help?</h2>
            <p className="mt-2 text-primary-foreground/80">
              Our support team is available Monday to Friday, 9am - 6pm
            </p>
            <Button variant="secondary" className="mt-4" asChild>
              <Link to="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
