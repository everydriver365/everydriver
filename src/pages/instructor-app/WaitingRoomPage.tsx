import { useNavigate } from "react-router-dom";
import { ArrowLeft, Video, ExternalLink, Calendar, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import waitingRoomPromo from "@/assets/waiting-room-promo.jpg";

const ZOOM_LINK = "https://zoom.us/j/PLACEHOLDER";

export default function WaitingRoomPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate(-1)} className="p-1">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">The Waiting Room</h1>
        </div>
      </div>

      {/* Hero Image */}
      <img src={waitingRoomPromo} alt="The Waiting Room" className="w-full h-48 object-cover" />

      {/* Content */}
      <div className="px-4 py-6 space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-xs font-semibold uppercase tracking-wide">
              Weekly
            </span>
          </div>
          <h2 className="text-2xl font-bold text-foreground">The Waiting Room</h2>
          <p className="text-muted-foreground mt-2">
            Informal weekly Zoom get-togethers for driving instructors. A relaxed space to chat, share tips, ask questions, and unwind with fellow ADIs.
          </p>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-secondary p-4 flex flex-col items-center text-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <p className="text-sm font-semibold text-foreground">Every Week</p>
            <p className="text-xs text-muted-foreground">Check back for times</p>
          </div>
          <div className="rounded-xl bg-secondary p-4 flex flex-col items-center text-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <p className="text-sm font-semibold text-foreground">Open to All</p>
            <p className="text-xs text-muted-foreground">All instructors welcome</p>
          </div>
        </div>

        {/* Join Button */}
        <a
          href={ZOOM_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <Button variant="default" size="lg" className="w-full gap-2 text-base">
            <Video className="h-5 w-5" />
            Join Zoom Meeting
            <ExternalLink className="h-4 w-4 ml-1" />
          </Button>
        </a>

        <p className="text-xs text-center text-muted-foreground">
          The Zoom link will open in a new tab. Make sure you have Zoom installed.
        </p>
      </div>
    </div>
  );
}
