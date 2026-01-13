import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Trash2, Save, Megaphone } from "lucide-react";

interface PromoMessage {
  id: string;
  message: string;
  link_url: string | null;
  link_text: string | null;
  is_active: boolean;
  display_order: number;
}

export function PromotionalMessageManager() {
  const [messages, setMessages] = useState<PromoMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  async function fetchMessages() {
    const { data, error } = await supabase
      .from("promotional_messages")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) {
      toast.error("Failed to load promotional messages");
    } else {
      setMessages(data || []);
    }
    setLoading(false);
  }

  async function handleSave(message: PromoMessage) {
    setSaving(message.id);
    const { error } = await supabase
      .from("promotional_messages")
      .update({
        message: message.message,
        link_url: message.link_url,
        link_text: message.link_text,
        is_active: message.is_active,
        display_order: message.display_order,
        updated_at: new Date().toISOString(),
      })
      .eq("id", message.id);

    if (error) {
      toast.error("Failed to save message");
    } else {
      toast.success("Message saved");
    }
    setSaving(null);
  }

  async function handleToggleActive(message: PromoMessage, checked: boolean) {
    // Update local state immediately
    updateMessage(message.id, { is_active: checked });
    
    // Save to database
    const { error } = await supabase
      .from("promotional_messages")
      .update({
        is_active: checked,
        updated_at: new Date().toISOString(),
      })
      .eq("id", message.id);

    if (error) {
      // Revert on error
      updateMessage(message.id, { is_active: !checked });
      toast.error("Failed to update status");
    } else {
      toast.success(checked ? "Banner activated" : "Banner deactivated");
    }
  }

  async function handleAdd() {
    const { data, error } = await supabase
      .from("promotional_messages")
      .insert({
        message: "New promotional message",
        is_active: false,
        display_order: messages.length + 1,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to add message");
    } else if (data) {
      setMessages([...messages, data]);
      toast.success("Message added");
    }
  }

  async function handleDelete(id: string) {
    const { error } = await supabase
      .from("promotional_messages")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete message");
    } else {
      setMessages(messages.filter((m) => m.id !== id));
      toast.success("Message deleted");
    }
  }

  function updateMessage(id: string, updates: Partial<PromoMessage>) {
    setMessages(
      messages.map((m) => (m.id === id ? { ...m, ...updates } : m))
    );
  }

  if (loading) {
    return <div className="animate-pulse h-32 bg-muted rounded-lg" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Manage the promotional banner that appears at the top of your site. Only the first active message is shown.
        </p>
        <Button onClick={handleAdd} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Message
        </Button>
      </div>

      {messages.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Megaphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No promotional messages yet. Add one to get started.</p>
          </CardContent>
        </Card>
      ) : (
        messages.map((message) => (
          <Card key={message.id} className={!message.is_active ? "opacity-60" : ""}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Megaphone className="h-4 w-4" />
                  Promotional Message
                </CardTitle>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={message.is_active}
                      onCheckedChange={(checked) =>
                        handleToggleActive(message, checked)
                      }
                    />
                    <Label className="text-sm">Active</Label>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(message.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Message Text</Label>
                <Textarea
                  value={message.message}
                  onChange={(e) =>
                    updateMessage(message.id, { message: e.target.value })
                  }
                  placeholder="Enter your promotional message..."
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Link URL (optional)</Label>
                  <Input
                    value={message.link_url || ""}
                    onChange={(e) =>
                      updateMessage(message.id, { link_url: e.target.value || null })
                    }
                    placeholder="/courses or https://..."
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Link Text (optional)</Label>
                  <Input
                    value={message.link_text || ""}
                    onChange={(e) =>
                      updateMessage(message.id, { link_text: e.target.value || null })
                    }
                    placeholder="Book Now"
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={() => handleSave(message)}
                  disabled={saving === message.id}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving === message.id ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
