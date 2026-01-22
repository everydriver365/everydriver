import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ParentMessageCardProps {
  instructorId: string;
  instructorName: string;
  childName: string;
  parentPhone: string;
}

export function ParentMessageCard({ 
  instructorId, 
  instructorName, 
  childName,
  parentPhone 
}: ParentMessageCardProps) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    setSending(true);
    try {
      // Get instructor's phone number
      const { data: instructor } = await supabase
        .from("instructors")
        .select("phone, name")
        .eq("id", instructorId)
        .single();

      if (!instructor?.phone) {
        toast.error("Unable to contact instructor");
        return;
      }

      // Send SMS to instructor via edge function
      const { error } = await supabase.functions.invoke("send-sms", {
        body: {
          to: instructor.phone,
          message: `Parent Portal Message about ${childName}:\n\n${message}\n\n- Reply to: ${parentPhone}`,
        },
      });

      if (error) throw error;

      toast.success("Message sent to instructor");
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Send className="h-4 w-4" />
          Message {instructorName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          placeholder={`Send a message about ${childName}...`}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          className="resize-none"
        />
        <Button 
          onClick={handleSend} 
          disabled={sending || !message.trim()}
          className="w-full"
        >
          {sending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Send Message
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
