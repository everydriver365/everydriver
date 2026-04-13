import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, MessageSquare } from "lucide-react";
import { useSchoolDemo } from "@/context/SchoolDemoContext";
import { format } from "date-fns";

interface Props {
  instructorIds: string[];
}

interface Conversation {
  id: string;
  instructor_id: string;
  pupil_id: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  pupil_name?: string;
  instructor_name?: string;
}

export default function SchoolMessagesSection({ instructorIds }: Props) {
  const { isDemo } = useSchoolDemo();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemo) {
      setConversations([
        { id: "1", instructor_id: "i1", pupil_id: "p1", last_message_at: new Date().toISOString(), last_message_preview: "Hi, can I reschedule my lesson on Thursday?", pupil_name: "Emma Davis", instructor_name: "John Smith" },
        { id: "2", instructor_id: "i2", pupil_id: "p2", last_message_at: new Date(Date.now() - 3600000).toISOString(), last_message_preview: "Thanks for the lesson today!", pupil_name: "Jack Brown", instructor_name: "Sarah Jones" },
      ]);
      setLoading(false);
      return;
    }
    if (!instructorIds.length) { setLoading(false); return; }
    const fetch = async () => {
      const { data } = await supabase
        .from("conversations")
        .select("*, pupils(name), instructors(name)")
        .in("instructor_id", instructorIds)
        .order("last_message_at", { ascending: false })
        .limit(50);
      setConversations(
        (data || []).map((c: any) => ({
          ...c,
          pupil_name: c.pupils?.name,
          instructor_name: c.instructors?.name,
        }))
      );
      setLoading(false);
    };
    fetch();
  }, [instructorIds, isDemo]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Pupil Messages</h2>
        <p className="text-muted-foreground">Recent conversations between your instructors and pupils</p>
      </div>
      {conversations.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">No messages found</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {conversations.map((c) => (
            <Card key={c.id} className="cursor-pointer hover:bg-muted/30 transition-colors">
              <CardContent className="flex items-start gap-3 py-4">
                <MessageSquare className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium truncate">{c.pupil_name || "Unknown Pupil"}</p>
                    {c.last_message_at && <span className="text-xs text-muted-foreground shrink-0">{format(new Date(c.last_message_at), "dd MMM HH:mm")}</span>}
                  </div>
                  <p className="text-xs text-muted-foreground">Instructor: {c.instructor_name || "Unknown"}</p>
                  {c.last_message_preview && <p className="text-sm text-muted-foreground truncate mt-1">{c.last_message_preview}</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
