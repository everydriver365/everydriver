import { useState, useEffect } from "react";
import { Mail, Lock, User, ArrowRight, Loader2, Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PupilRegisterProps {
  instructorId?: string | null;
  instructorName?: string | null;
}

export default function PupilRegister({ instructorId, instructorName }: PupilRegisterProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedInstructorId, setSelectedInstructorId] = useState(instructorId || "");
  const [instructors, setInstructors] = useState<{ id: string; name: string }[]>([]);
  const [loadingInstructors, setLoadingInstructors] = useState(false);
  const [comboboxOpen, setComboboxOpen] = useState(false);

  const showSelector = !instructorId;

  useEffect(() => {
    if (!showSelector) return;
    const fetchInstructors = async () => {
      setLoadingInstructors(true);
      const { data } = await supabase
        .from("public_instructors" as any)
        .select("id, name")
        .eq("pupil_app_enabled", true)
        .eq("is_active", true)
        .order("name");
      if (data) setInstructors(data as any);
      setLoadingInstructors(false);
    };
    fetchInstructors();
  }, [showSelector]);

  useEffect(() => {
    if (instructorId) setSelectedInstructorId(instructorId);
  }, [instructorId]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }
    if (!password) {
      toast.error("Please enter a password");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (showSelector && !selectedInstructorId) {
      toast.error("Please select your instructor");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("pupil-email-auth", {
        body: {
          action: "register",
          email: email.trim(),
          password,
          name: name.trim(),
          instructorId: selectedInstructorId || undefined,
        },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        setLoading(false);
        return;
      }

      toast.success("Registration successful! You can now sign in.");
      window.dispatchEvent(new CustomEvent("pupil-registered"));
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleRegister} className="space-y-4">
      <div className="space-y-3">
        {instructorName && (
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700 text-center">
            Registering with <span className="font-semibold">{instructorName}</span>
          </div>
        )}

        {showSelector && (
          <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={comboboxOpen}
                className="w-full h-12 justify-between bg-white border-slate-200 text-slate-900 hover:bg-slate-50 hover:text-slate-900"
              >
                {selectedInstructorId
                  ? instructors.find((i) => i.id === selectedInstructorId)?.name
                  : loadingInstructors
                    ? "Loading instructors..."
                    : "Search for your instructor..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
              <Command>
                <CommandInput placeholder="Type to search..." />
                <CommandList>
                  <CommandEmpty>No instructor found.</CommandEmpty>
                  <CommandGroup>
                    {instructors.map((inst) => (
                      <CommandItem
                        key={inst.id}
                        value={inst.name}
                        onSelect={() => {
                          setSelectedInstructorId(inst.id);
                          setComboboxOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedInstructorId === inst.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {inst.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}

        <div className="relative">
          <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="text"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="pl-10 h-12 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-emerald-500 focus-visible:ring-offset-0"
            autoComplete="name"
            autoFocus={!!instructorId}
          />
        </div>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10 h-12 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-emerald-500 focus-visible:ring-offset-0"
            autoComplete="email"
          />
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="password"
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10 h-12 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-emerald-500 focus-visible:ring-offset-0"
            autoComplete="new-password"
          />
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="pl-10 h-12 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-emerald-500 focus-visible:ring-offset-0"
            autoComplete="new-password"
          />
        </div>
        <p className="text-xs text-slate-500">
          {showSelector
            ? "Select your instructor and create your account to get started."
            : "Your instructor must have your email on file for registration to work."}
        </p>
      </div>

      <Button
        type="submit"
        className="w-full h-12 text-base bg-emerald-500 hover:bg-emerald-600 text-white"
        disabled={loading || !name.trim() || !email.trim() || !password || !confirmPassword || (showSelector && !selectedInstructorId)}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Registering...
          </>
        ) : (
          <>
            Create Account
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
    </form>
  );
}
