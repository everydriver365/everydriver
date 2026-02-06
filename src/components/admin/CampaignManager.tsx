import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Send, MessageSquare, Mail, Users, Loader2 } from "lucide-react";

interface Campaign {
  id: string;
  channel: string;
  audience_type: string;
  subject: string | null;
  message: string;
  recipient_count: number;
  status: string;
  sent_at: string | null;
  created_at: string;
}

export function CampaignManager() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Compose form
  const [channel, setChannel] = useState<"sms" | "email">("sms");
  const [audienceType, setAudienceType] = useState("all_instructors");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_campaigns")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      setCampaigns((data || []) as Campaign[]);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCampaigns(); }, []);

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }
    if (channel === "email" && !subject.trim()) {
      toast.error("Please enter a subject for the email");
      return;
    }

    setSending(true);
    try {
      // Create campaign record
      const { data: campaign, error: insertError } = await supabase
        .from("admin_campaigns")
        .insert({
          channel,
          audience_type: audienceType,
          subject: channel === "email" ? subject : null,
          message,
          status: "draft",
          recipient_count: 0,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Call edge function to send
      const { data, error } = await supabase.functions.invoke("send-campaign", {
        body: { campaignId: campaign.id },
      });

      if (error) throw error;

      toast.success(`Campaign sent to ${data?.recipientCount || 0} recipients`);
      setMessage("");
      setSubject("");
      fetchCampaigns();
    } catch (error: any) {
      console.error("Error sending campaign:", error);
      toast.error(error.message || "Failed to send campaign");
    } finally {
      setSending(false);
    }
  };

  const smsCharCount = message.length;
  const smsSegments = Math.ceil(smsCharCount / 160) || 0;

  return (
    <div className="space-y-6">
      {/* Compose */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Send className="h-5 w-5" />
            Compose Campaign
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Channel</label>
              <Select value={channel} onValueChange={(v) => setChannel(v as "sms" | "email")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sms">
                    <span className="flex items-center gap-2"><MessageSquare className="h-4 w-4" /> SMS</span>
                  </SelectItem>
                  <SelectItem value="email">
                    <span className="flex items-center gap-2"><Mail className="h-4 w-4" /> Email</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Audience</label>
              <Select value={audienceType} onValueChange={setAudienceType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_instructors">All Instructors</SelectItem>
                  <SelectItem value="all_pupils">All Pupils</SelectItem>
                  <SelectItem value="active_instructors">Active Instructors Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {channel === "email" && (
            <div>
              <label className="text-sm font-medium mb-1 block">Subject</label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Email subject line..." />
            </div>
          )}

          <div>
            <label className="text-sm font-medium mb-1 block">Message</label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="Type your message..." />
            {channel === "sms" && (
              <p className="text-xs text-muted-foreground mt-1">
                {smsCharCount} characters · {smsSegments} SMS segment{smsSegments !== 1 ? "s" : ""}
              </p>
            )}
          </div>

          <Button onClick={handleSend} disabled={sending || !message.trim()}>
            {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            {sending ? "Sending..." : "Send Campaign"}
          </Button>
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Campaign History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No campaigns sent yet</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Audience</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Message</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="text-sm whitespace-nowrap">
                      {format(new Date(c.sent_at || c.created_at), "dd MMM yyyy HH:mm")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{c.channel}</Badge>
                    </TableCell>
                    <TableCell className="text-sm capitalize">{c.audience_type.replace(/_/g, " ")}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {c.recipient_count}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={c.status === "sent" ? "default" : "secondary"} className={c.status === "sent" ? "bg-emerald-600" : ""}>
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm">{c.message}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
