import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PreChatFormProps {
  onSubmit: (data: PreChatFormData) => void;
  loading?: boolean;
  instructorName?: string;
}

export interface PreChatFormData {
  name: string;
  email?: string;
  phone?: string;
  message?: string;
}

export function PreChatForm({ onSubmit, loading, instructorName }: PreChatFormProps) {
  const [formData, setFormData] = useState<PreChatFormData>({
    name: "",
    phone: "",
    message: "",
  });
  const [errors, setErrors] = useState<Partial<PreChatFormData>>({});

  const validate = () => {
    const newErrors: Partial<PreChatFormData> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-3 flex flex-col h-full"
      onSubmit={handleSubmit}
    >
      <div className="text-center mb-2">
        <h3 className="font-semibold text-sm">
          {instructorName ? `Chat with ${instructorName}` : "Start a Conversation"}
        </h3>
      </div>

      <div className="space-y-2 flex-1">
        <div>
          <Input
            id="chat-name"
            placeholder="Your name *"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            className={cn("h-9", errors.name && "border-destructive")}
          />
          {errors.name && (
            <p className="text-xs text-destructive mt-0.5">{errors.name}</p>
          )}
        </div>

        <Input
          id="chat-phone"
          type="tel"
          placeholder="Phone (optional)"
          value={formData.phone}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, phone: e.target.value }))
          }
          className="h-9"
        />

        <Textarea
          id="chat-message"
          placeholder="How can we help? (optional)"
          value={formData.message}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, message: e.target.value }))
          }
          rows={2}
          className="resize-none text-sm"
        />
      </div>

      <Button type="submit" className="w-full mt-2 h-9" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Starting...
          </>
        ) : (
          "Start Chat"
        )}
      </Button>
    </motion.form>
  );
}
