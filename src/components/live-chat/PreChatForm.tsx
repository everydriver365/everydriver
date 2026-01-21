import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

interface PreChatFormProps {
  onSubmit: (data: PreChatFormData) => void;
  loading?: boolean;
  instructorName?: string;
}

export interface PreChatFormData {
  name: string;
  email: string;
  phone?: string;
  message?: string;
}

export function PreChatForm({ onSubmit, loading, instructorName }: PreChatFormProps) {
  const [formData, setFormData] = useState<PreChatFormData>({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [errors, setErrors] = useState<Partial<PreChatFormData>>({});

  const validate = () => {
    const newErrors: Partial<PreChatFormData> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 space-y-4"
      onSubmit={handleSubmit}
    >
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
          <MessageCircle className="h-6 w-6 text-primary" />
        </div>
        <h3 className="font-semibold text-lg">
          {instructorName ? `Chat with ${instructorName}` : "Start a Conversation"}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Please provide your details to begin
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <Label htmlFor="chat-name">Name *</Label>
          <Input
            id="chat-name"
            placeholder="Your name"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            className={errors.name ? "border-destructive" : ""}
          />
          {errors.name && (
            <p className="text-sm text-destructive mt-1">{errors.name}</p>
          )}
        </div>

        <div>
          <Label htmlFor="chat-email">Email *</Label>
          <Input
            id="chat-email"
            type="email"
            placeholder="your@email.com"
            value={formData.email}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, email: e.target.value }))
            }
            className={errors.email ? "border-destructive" : ""}
          />
          {errors.email && (
            <p className="text-sm text-destructive mt-1">{errors.email}</p>
          )}
        </div>

        <div>
          <Label htmlFor="chat-phone">Phone (optional)</Label>
          <Input
            id="chat-phone"
            type="tel"
            placeholder="Your phone number"
            value={formData.phone}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, phone: e.target.value }))
            }
          />
        </div>

        <div>
          <Label htmlFor="chat-message">How can we help? (optional)</Label>
          <Textarea
            id="chat-message"
            placeholder="Tell us what you're looking for..."
            value={formData.message}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, message: e.target.value }))
            }
            rows={3}
          />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Starting Chat...
          </>
        ) : (
          <>
            <MessageCircle className="h-4 w-4 mr-2" />
            Start Chat
          </>
        )}
      </Button>
    </motion.form>
  );
}
