import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Megaphone, Plus } from "lucide-react";
import { useSchoolDemo } from "@/context/SchoolDemoContext";

interface Props {
  schoolId: string;
}

const demoCampaigns = [
  { id: "1", subject: "Summer Intensive Offer", status: "sent", channel: "email", recipient_count: 45, sent_at: "2026-03-15T10:00:00Z" },
  { id: "2", subject: "Easter Crash Courses", status: "draft", channel: "sms", recipient_count: 0, sent_at: null },
];

export default function SchoolCampaignsSection({ schoolId }: Props) {
  const { isDemo } = useSchoolDemo();
  const campaigns = isDemo ? demoCampaigns : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Campaigns</h2>
          <p className="text-muted-foreground">Marketing campaigns for your school's pupils</p>
        </div>
        <Button disabled><Plus className="h-4 w-4 mr-1" />New Campaign</Button>
      </div>
      {campaigns.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">No campaigns yet — coming soon</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => (
            <Card key={c.id}>
              <CardContent className="flex items-center gap-4 py-4">
                <Megaphone className="h-5 w-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{c.subject}</p>
                  <p className="text-sm text-muted-foreground capitalize">{c.channel} • {c.recipient_count} recipients</p>
                </div>
                <Badge variant={c.status === "sent" ? "default" : "secondary"}>{c.status}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
