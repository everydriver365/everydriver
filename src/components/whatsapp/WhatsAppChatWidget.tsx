import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Minimize2, Send, ArrowLeft, Search, Loader2, MessageCircle, RotateCcw, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, addDays, startOfDay, getDay } from "date-fns";
import { cn } from "@/lib/utils";
import { WhatsAppBookingCard, type BookingResult } from "./WhatsAppBookingCard";
import { useNavigate } from "react-router-dom";
import { useInstructorOnlineStatus } from "@/hooks/useInstructorOnlineStatus";
import { TypingIndicator } from "@/components/ui/typing-indicator";

interface WhatsAppChatWidgetProps {
  instructorId?: string;
  instructorName?: string;
}

interface ChatMessage {
  id: string;
  content: string;
  direction: string;
  sender_type: string;
  created_at: string;
}

type BookingStep = null | "courseType" | "transmission" | "genderPref" | "postcode" | "results";

type CourseType = "intensive" | "semi-intensive" | "weekly" | null;
type TransmissionPref = "automatic" | "manual" | "no-preference" | null;
type GenderPref = "male" | "female" | "no-preference" | null;

// Chat icon component
function ChatIcon({ className }: { className?: string }) {
  return <MessageCircle className={className} />;
}

const STORAGE_KEY = "whatsapp_widget_session";

const COURSE_OPTIONS = [
  { hours: 10, label: "10 Hours" },
  { hours: 20, label: "20 Hours" },
  { hours: 30, label: "30 Hours" },
  { hours: 40, label: "40 Hours" },
  { hours: 28, label: "Test in a Week" },
];

function findFirstAvailableDate(
  instructor: any,
  workingHours: any[],
  dateOverrides: any[]
): Date | null {
  const today = startOfDay(new Date());
  for (let i = 0; i < 90; i++) {
    const day = addDays(today, i);
    const dateStr = format(day, "yyyy-MM-dd");

    if (instructor.available_from && instructor.available_from > dateStr) continue;

    const dayOfWeek = getDay(day);
    const override = dateOverrides.find(
      (o: any) =>
        o.instructor_id === instructor.id &&
        (o.override_date === dateStr ||
          (o.override_end_date && dateStr >= o.override_date && dateStr <= o.override_end_date))
    );
    if (override) {
      if (override.is_available) return day;
      continue;
    }
    if (workingHours.some((wh: any) => wh.instructor_id === instructor.id && wh.day_of_week === dayOfWeek && wh.is_active)) {
      return day;
    }
  }
  return null;
}

export function WhatsAppChatWidget({ instructorId, instructorName }: WhatsAppChatWidgetProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [visitorName, setVisitorName] = useState("");
  const [visitorPhone, setVisitorPhone] = useState("");
  const [hasStarted, setHasStarted] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAwaitingReply, setIsAwaitingReply] = useState(false);
  const instructorOnline = useInstructorOnlineStatus(instructorId);

  // Booking flow state
  const [bookingStep, setBookingStep] = useState<BookingStep>(null);
  const [bookingPostcode, setBookingPostcode] = useState("");
  const [bookingHours, setBookingHours] = useState<number>(0);
  const [bookingResults, setBookingResults] = useState<BookingResult[]>([]);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [visibleResultsCount, setVisibleResultsCount] = useState(4);
  const [courseTypePref, setCourseTypePref] = useState<CourseType>(null);
  const [transmissionPref, setTransmissionPref] = useState<TransmissionPref>(null);
  const [genderPref, setGenderPref] = useState<GenderPref>(null);
  useEffect(() => {
    const key = `${STORAGE_KEY}_${instructorId || "admin"}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        // Check if conversation is still alive before restoring
        (async () => {
          const { data: conv } = await supabase
            .from("whatsapp_conversations")
            .select("ai_enabled, instructor_id, last_message_at")
            .eq("id", data.conversationId)
            .maybeSingle();

          if (!conv) {
            // Conversation deleted or not found — clear session
            localStorage.removeItem(key);
            return;
          }

          // If AI is disabled and no instructor assigned, auto-reset AI
          if (!conv.ai_enabled && !conv.instructor_id) {
            await supabase.from("whatsapp_conversations")
              .update({ ai_enabled: true })
              .eq("id", data.conversationId);
          }

          setConversationId(data.conversationId);
          setVisitorName(data.visitorName);
          setVisitorPhone(data.visitorPhone);
          setHasStarted(true);
        })();
      } catch { localStorage.removeItem(key); }
    }
  }, [instructorId]);

  // Start a fresh conversation
  const handleNewChat = () => {
    const key = `${STORAGE_KEY}_${instructorId || "admin"}`;
    localStorage.removeItem(key);
    setConversationId(null);
    setMessages([]);
    setHasStarted(false);
    setVisitorName("");
    setVisitorPhone("");
    setBookingStep(null);
    setBookingPostcode("");
    setBookingHours(0);
    setBookingResults([]);
    setInputMessage("");
  };

  // Fetch messages
  useEffect(() => {
    if (!conversationId) return;
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("whatsapp_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      if (data) setMessages(data as ChatMessage[]);
    };
    fetchMessages();

    const channel = supabase
      .channel(`wa-widget-${conversationId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "whatsapp_messages",
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => {
        const newMsg = payload.new as ChatMessage;
        setMessages(prev => [...prev, newMsg]);
        if (newMsg.direction === "outbound") {
          setIsAwaitingReply(false);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, bookingStep, bookingResults]);

  const handleStartChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorName.trim() || !visitorPhone.trim()) return;
    setSending(true);

    try {
      const { data: conv, error: convErr } = await supabase
        .from("whatsapp_conversations")
        .insert({
          phone_number: visitorPhone.trim(),
          visitor_name: visitorName.trim(),
          instructor_id: instructorId || null,
          ai_enabled: true,
        })
        .select("id")
        .single();

      if (convErr) throw convErr;

      setConversationId(conv.id);
      setHasStarted(true);
      localStorage.setItem(`${STORAGE_KEY}_${instructorId || "admin"}`, JSON.stringify({
        conversationId: conv.id,
        visitorName: visitorName.trim(),
        visitorPhone: visitorPhone.trim(),
      }));

      // Start the intake flow - ask course type first
      addLocalBotMessage(`Hi ${visitorName.trim()}! 👋 What type of lessons are you looking for?`);
      setBookingStep("courseType");
    } catch (err) {
      console.error("Failed to start chat:", err);
      toast.error("Failed to start chat");
    } finally {
      setSending(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || !conversationId) return;

    // Intercept booking trigger
    if (/i'd like to book|id like to book|like to book|want to book|book a course|book lessons/i.test(content)) {
      addLocalBotMessage("Great! Let me help you find the perfect course. What type of lessons are you looking for?");
      setBookingStep("courseType");
      return;
    }

    // Detect UK postcode typed directly — auto-enter booking flow and search all courses
    const postcodeMatch = content.trim().match(/^([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})$/i);
    if (postcodeMatch) {
      handleAllCoursesSearch(postcodeMatch[1]);
      return;
    }

    setInputMessage("");
    setSending(true);

    try {
      await supabase.from("whatsapp_messages").insert({
        conversation_id: conversationId,
        content,
        direction: "inbound",
        sender_type: "visitor",
      });

      await supabase.from("whatsapp_conversations").update({
        last_message_at: new Date().toISOString(),
      }).eq("id", conversationId);

      setIsAwaitingReply(true);
      const awaitingTimeout = setTimeout(() => setIsAwaitingReply(false), 30000);
      supabase.functions.invoke("whatsapp-webhook", {
        body: {
          widget_message: true,
          conversation_id: conversationId,
          message: content,
          visitor_name: visitorName,
          visitor_phone: visitorPhone,
          instructor_id: instructorId,
        },
      }).then(({ data }) => {
        // If no AI reply is coming (e.g. forwarded to human, AI disabled), clear typing immediately
        if (data?.status === "forwarded_to_human" || !data?.ai_reply) {
          clearTimeout(awaitingTimeout);
          setIsAwaitingReply(false);
        }
      }).catch(err => {
        console.error("AI reply error:", err);
        clearTimeout(awaitingTimeout);
        setIsAwaitingReply(false);
      });
    } catch (err) {
      console.error("Send failed:", err);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const addLocalBotMessage = (content: string) => {
    const msg: ChatMessage = {
      id: `local-${Date.now()}`,
      content,
      direction: "outbound",
      sender_type: "bot",
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, msg]);
  };

  const handlePostcodeSubmit = () => {
    if (!bookingPostcode.trim()) return;
    handleAllCoursesSearch(bookingPostcode.trim());
  };

  const handleAllCoursesSearch = async (postcode: string) => {
    const pc = postcode.toUpperCase();
    setBookingPostcode(pc);
    addLocalBotMessage(`🔎 Finding all available courses near ${pc}…`);
    setBookingStep("results");
    setBookingLoading(true);
    setVisibleResultsCount(4);

    try {
      const geoRes = await supabase.functions.invoke("geocode-postcode", {
        body: { postcodes: [pc] },
      });
      const geoResults = geoRes.data?.results || [];
      const searchLat = geoResults[0]?.latitude;
      const searchLng = geoResults[0]?.longitude;

      if (!searchLat || !searchLng) {
        addLocalBotMessage("😕 I couldn't find that postcode. Please try again.");
        setBookingStep("postcode");
        setBookingLoading(false);
        return;
      }

      const [
        { data: instructors, error: instructorsError },
        { data: courses, error: coursesError },
        { data: workingHours, error: workingHoursError },
        { data: dateOverrides, error: dateOverridesError },
      ] = await Promise.all([
        supabase
          .from("instructors")
          .select("id, name, profile_image_url, car_type, hourly_rate, available_from, app_slug, gender, home_latitude:lat, home_longitude:lng")
          .eq("is_active", true),
        supabase.from("instructor_courses").select("instructor_id, course_hours, discounted_price, is_active").eq("is_active", true),
        supabase.from("instructor_working_hours").select("instructor_id, day_of_week, is_active").eq("is_active", true),
        supabase.from("instructor_date_overrides").select("instructor_id, override_date, override_end_date, is_available"),
      ]);

      if (instructorsError || coursesError || workingHoursError || dateOverridesError) {
        console.error("Booking search query failed", { instructorsError, coursesError, workingHoursError, dateOverridesError });
        addLocalBotMessage("😕 I couldn't load instructor availability right now. Please try again in a moment.");
        setBookingStep(null);
        setBookingLoading(false);
        return;
      }

      if (!instructors?.length) {
        addLocalBotMessage("😕 No instructors found at the moment. Try chatting with us for help!");
        setBookingStep(null);
        setBookingLoading(false);
        return;
      }

      const withDistance = instructors
        .filter((i: any) => i.home_latitude && i.home_longitude)
        .filter((i: any) => {
          // Filter by transmission preference
          if (transmissionPref && transmissionPref !== "no-preference") {
            const carType = (i.car_type || "").toLowerCase();
            if (!carType.includes(transmissionPref)) return false;
          }
          // Filter by gender preference
          if (genderPref && genderPref !== "no-preference" && i.gender) {
            if (i.gender.toLowerCase() !== genderPref) return false;
          }
          return true;
        })
        .map((i: any) => {
          const dLat = (i.home_latitude - searchLat) * 111;
          const dLng = (i.home_longitude - searchLng) * 111 * Math.cos(searchLat * Math.PI / 180);
          return { ...i, distance: Math.sqrt(dLat * dLat + dLng * dLng) };
        })
        .filter((i: any) => i.distance < 24)
        .sort((a: any, b: any) => a.distance - b.distance);

      const results: BookingResult[] = [];
      for (const inst of withDistance.slice(0, 20)) {
        const nextDate = findFirstAvailableDate(inst, workingHours || [], dateOverrides || []);
        if (!nextDate) continue;

        // Get all courses this instructor offers
        const instructorCourses = (courses || []).filter((c: any) => c.instructor_id === inst.id);
        
        if (instructorCourses.length > 0) {
          // Create a result for each course the instructor offers
          for (const ic of instructorCourses) {
            results.push({
              instructorId: inst.id,
              instructorName: inst.name,
              profileImageUrl: inst.profile_image_url,
              hourlyRate: inst.hourly_rate,
              carType: inst.car_type || "Car",
              nextAvailable: nextDate,
              hours: ic.course_hours,
              discountedPrice: ic.discounted_price || null,
              slug: inst.app_slug,
            });
          }
        } else {
          // Fallback: show with default hourly rate for common hours
          for (const opt of COURSE_OPTIONS) {
            results.push({
              instructorId: inst.id,
              instructorName: inst.name,
              profileImageUrl: inst.profile_image_url,
              hourlyRate: inst.hourly_rate,
              carType: inst.car_type || "Car",
              nextAvailable: nextDate,
              hours: opt.hours,
              discountedPrice: null,
              slug: inst.app_slug,
            });
          }
        }
      }

      // Sort by price (cheapest first)
      results.sort((a, b) => {
        const priceA = a.discountedPrice ?? (a.hourlyRate ? a.hourlyRate * a.hours : Infinity);
        const priceB = b.discountedPrice ?? (b.hourlyRate ? b.hourlyRate * b.hours : Infinity);
        return priceA - priceB;
      });

      setBookingResults(results);
      if (results.length === 0) {
        addLocalBotMessage("😕 No instructors with availability found near you. Try a different postcode.");
      } else {
        addLocalBotMessage(`🎉 Found ${results.length} course${results.length > 1 ? "s" : ""} near you! Tap one to book.`);
      }
    } catch (err) {
      console.error("Booking search error:", err);
      addLocalBotMessage("😕 Something went wrong searching. Please try again.");
      setBookingStep("postcode");
    } finally {
      setBookingLoading(false);
    }
  };

  const handleBookingCardSelect = (result: BookingResult) => {
    const dateStr = format(result.nextAvailable, "yyyy-MM-dd");
    navigate(`/book/${result.instructorId}?hours=${result.hours}&date=${dateStr}`);
  };

  const cancelBookingFlow = () => {
    setBookingStep(null);
    setBookingPostcode("");
    setBookingHours(0);
    setBookingResults([]);
    setCourseTypePref(null);
    setTransmissionPref(null);
    setGenderPref(null);
    addLocalBotMessage("No problem! Feel free to ask me anything else. 😊");
  };

  const handleCourseTypeSelect = (type: CourseType) => {
    setCourseTypePref(type);
    const label = type === "intensive" ? "Intensive course" : type === "semi-intensive" ? "Semi-intensive course" : "Weekly lessons";
    addLocalBotMessage(`Great choice — ${label}! 🚗 Do you prefer automatic or manual?`);
    setBookingStep("transmission");
  };

  const handleTransmissionSelect = (pref: TransmissionPref) => {
    setTransmissionPref(pref);
    const label = pref === "no-preference" ? "No preference" : pref === "automatic" ? "Automatic" : "Manual";
    addLocalBotMessage(`${label} it is! 👤 Do you have a preference for a male or female instructor?`);
    setBookingStep("genderPref");
  };

  const handleGenderSelect = (pref: GenderPref) => {
    setGenderPref(pref);
    const label = pref === "no-preference" ? "No preference" : pref === "male" ? "Male instructor" : "Female instructor";
    addLocalBotMessage(`${label} — noted! 📍 Now enter your postcode so I can find the best options near you.`);
    setBookingStep("postcode");
  };

  const handleSend = () => {
    handleSendMessage(inputMessage.trim());
    setInputMessage("");
  };

  const handleClose = () => { setIsOpen(false); setIsMinimized(false); };
  const handleMinimize = () => { setIsMinimized(true); setIsOpen(false); };

  const renderBookingInput = () => {
    if (bookingStep === "courseType") {
      return (
        <div className="px-4 py-3 border-t border-border space-y-2">
          <p className="text-xs font-semibold text-foreground">🎓 What type of course?</p>
          <div className="grid grid-cols-1 gap-1.5">
            {[
              { value: "intensive" as CourseType, label: "🔥 Intensive (1-2 weeks)", desc: "Pass fast" },
              { value: "semi-intensive" as CourseType, label: "⚡ Semi-Intensive (2-4 weeks)", desc: "Balanced pace" },
              { value: "weekly" as CourseType, label: "📅 Weekly Lessons", desc: "Learn at your own pace" },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => handleCourseTypeSelect(opt.value)}
                className="flex items-center justify-between px-3 py-2.5 text-xs font-medium rounded-lg border border-border bg-muted/50 text-foreground hover:bg-primary/10 hover:border-primary/30 transition-colors text-left"
              >
                <span>{opt.label}</span>
                <span className="text-muted-foreground text-[10px]">{opt.desc}</span>
              </button>
            ))}
          </div>
          <button onClick={cancelBookingFlow} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" /> Back to chat
          </button>
        </div>
      );
    }

    if (bookingStep === "transmission") {
      return (
        <div className="px-4 py-3 border-t border-border space-y-2">
          <p className="text-xs font-semibold text-foreground">🚗 Automatic or Manual?</p>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { value: "automatic" as TransmissionPref, label: "Automatic" },
              { value: "manual" as TransmissionPref, label: "Manual" },
              { value: "no-preference" as TransmissionPref, label: "Either" },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => handleTransmissionSelect(opt.value)}
                className="px-3 py-2.5 text-xs font-medium rounded-lg border border-border bg-muted/50 text-foreground hover:bg-primary/10 hover:border-primary/30 transition-colors"
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button onClick={cancelBookingFlow} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" /> Back to chat
          </button>
        </div>
      );
    }

    if (bookingStep === "genderPref") {
      return (
        <div className="px-4 py-3 border-t border-border space-y-2">
          <p className="text-xs font-semibold text-foreground">👤 Instructor preference?</p>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { value: "male" as GenderPref, label: "Male" },
              { value: "female" as GenderPref, label: "Female" },
              { value: "no-preference" as GenderPref, label: "Either" },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => handleGenderSelect(opt.value)}
                className="px-3 py-2.5 text-xs font-medium rounded-lg border border-border bg-muted/50 text-foreground hover:bg-primary/10 hover:border-primary/30 transition-colors"
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button onClick={cancelBookingFlow} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" /> Back to chat
          </button>
        </div>
      );
    }

    if (bookingStep === "postcode") {
      return (
        <div className="px-4 py-3 border-t border-border space-y-2">
          <div className="flex items-center gap-1.5 mb-1">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            <p className="text-xs font-semibold text-foreground">Enter your postcode to find courses nearby</p>
          </div>
          <div className="flex items-center gap-2">
            <Input
              value={bookingPostcode}
              onChange={e => setBookingPostcode(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handlePostcodeSubmit()}
              placeholder="e.g. SW1A 1AA"
              className="flex-1 uppercase text-sm font-medium"
              autoFocus
            />
            <Button size="icon" onClick={handlePostcodeSubmit} disabled={!bookingPostcode.trim()} className="shrink-0">
              <Search className="h-4 w-4" />
            </Button>
          </div>
          <button onClick={cancelBookingFlow} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" /> Back to chat
          </button>
        </div>
      );
    }


    if (bookingStep === "results") {
      return (
        <div className="px-4 py-3 border-t border-border">
          <button onClick={cancelBookingFlow} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" /> Back to chat
          </button>
        </div>
      );
    }

    // Default chat input
    return (
      <div className="flex items-center gap-2 px-4 py-3 border-t border-border">
        <Input
          value={inputMessage}
          onChange={e => setInputMessage(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSend()}
          placeholder="Type a message…"
          className="flex-1"
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={!inputMessage.trim() || sending}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  return (
    <>
      {/* FAB — bottom-left */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-24 md:bottom-6 left-4 md:left-6 z-40"
          >
            <Button
              size="lg"
              onClick={() => setIsOpen(true)}
              className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow bg-primary text-primary-foreground"
            >
              <ChatIcon className="h-6 w-6" />
            </Button>
            {isMinimized && conversationId && (
              <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 animate-pulse" />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-20 md:bottom-6 left-2 right-2 md:right-auto md:left-6 z-40 md:w-[380px]"
          >
            <Card className="overflow-hidden shadow-2xl border-0">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <ChatIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          "inline-block h-2.5 w-2.5 rounded-full",
                          instructorOnline ? "bg-green-400 animate-pulse" : "bg-white/40"
                        )}
                      />
                      <h3 className="font-semibold text-sm">{instructorName || "Chat with us"}</h3>
                    </div>
                    <p className="text-xs opacity-80">
                      {instructorOnline
                        ? "Online now"
                        : "Usually replies instantly"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {hasStarted && (
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-primary-foreground hover:bg-white/20" onClick={handleNewChat} title="New conversation">
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-primary-foreground hover:bg-white/20" onClick={handleMinimize}>
                    <Minimize2 className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-primary-foreground hover:bg-white/20" onClick={handleClose}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Content */}
              <div className="h-[50vh] md:h-[400px] max-h-[400px] bg-background flex flex-col">
                {!hasStarted ? (
                  /* Pre-chat form */
                  <form onSubmit={handleStartChat} className="flex-1 p-4 space-y-4 overflow-y-auto">
                    <div className="bg-primary/10 rounded-lg p-3 text-sm text-primary">
                      <p className="font-medium">👋 Hi there!</p>
                      <p className="mt-1 text-xs">Enter your details to start chatting. Our AI assistant will help you instantly!</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="wa-name" className="text-xs">Your Name</Label>
                      <Input id="wa-name" value={visitorName} onChange={e => setVisitorName(e.target.value)} placeholder="John Smith" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="wa-phone" className="text-xs">Phone Number</Label>
                      <Input id="wa-phone" type="tel" value={visitorPhone} onChange={e => setVisitorPhone(e.target.value)} placeholder="07700 900000" required />
                    </div>
                    <Button type="submit" className="w-full" disabled={sending}>
                      {sending ? "Starting…" : "Start Chat"}
                    </Button>
                  </form>
                ) : (
                  /* Chat */
                  <>
                    <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
                      {messages.length === 0 && (
                        <p className="text-center text-muted-foreground text-xs mt-8">Tap a suggestion or type your own!</p>
                      )}
                      {messages.map(msg => {
                        const isOutbound = msg.direction === "outbound";
                        return (
                          <div key={msg.id} className={cn("flex", isOutbound ? "justify-start" : "justify-end")}>
                            <div className={cn(
                              "max-w-[75%] px-3 py-2 rounded-2xl text-sm",
                              isOutbound
                                ? "bg-muted text-foreground rounded-bl-md"
                                : "bg-primary text-primary-foreground rounded-br-md"
                            )}>

                              <p className="whitespace-pre-wrap">{msg.content}</p>
                              <p className={cn("text-[10px] mt-1", isOutbound ? "text-muted-foreground" : "text-primary-foreground/70")}>
                                {format(new Date(msg.created_at), "HH:mm")}
                                {isOutbound && msg.sender_type === "ai" && " · 🤖 AI"}
                              </p>
                            </div>
                          </div>
                        );
                      })}

                      {/* Typing indicator */}
                      <AnimatePresence>
                        {isAwaitingReply && (
                          <TypingIndicator name={instructorName || "Assistant"} />
                        )}
                      </AnimatePresence>

                      {bookingStep === "results" && !bookingLoading && bookingResults.length > 0 && (
                        <div className="space-y-2 pt-1">
                          {bookingResults.slice(0, visibleResultsCount).map((result, idx) => (
                            <WhatsAppBookingCard key={`${result.instructorId}-${result.hours}`} result={result} onSelect={handleBookingCardSelect} />
                          ))}
                          {bookingResults.length > visibleResultsCount && (
                            <button
                              onClick={() => setVisibleResultsCount(prev => prev + 4)}
                              className="w-full py-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors flex items-center justify-center gap-1 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10"
                            >
                              View more courses ({bookingResults.length - visibleResultsCount} more)
                            </button>
                          )}
                        </div>
                      )}

                      {/* Loading spinner for booking search */}
                      {bookingLoading && (
                        <div className="flex justify-center py-4">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      )}

                      {/* Contextual suggestion chips */}
                      {bookingStep === null && (messages.length === 0 || messages[messages.length - 1]?.direction === "outbound") && !sending && (() => {
                        const allContent = messages.map(m => m.content.toLowerCase()).join(" ");
                        const askedTopics = {
                          transmission: /manual|automatic|gearbox/i.test(allContent),
                          pricing: /price|cost|how much|£|rate/i.test(allContent),
                          availability: /available|when|this week|book|schedule/i.test(allContent),
                          intensive: /intensive|crash course|fast track|quick/i.test(allContent),
                          areas: /area|cover|where|location|postcode/i.test(allContent),
                          beginner: /beginner|first time|never driven|new learner/i.test(allContent),
                          test: /test|exam|pass|practical/i.test(allContent),
                        };

                        let suggestions: string[] = [];

                        if (messages.length === 0) {
                          suggestions = [
                            "🚗 Manual lessons",
                            "🚗 Automatic lessons",
                            "💰 How much are lessons?",
                            "🎓 Intensive courses",
                            "🆕 I'm a complete beginner",
                          ];
                        } else if (askedTopics.transmission && !askedTopics.pricing) {
                          suggestions = [
                            "💰 How much per hour?",
                            "📅 When can I start?",
                            "🎓 Any intensive options?",
                            "📍 Do you cover my area?",
                          ];
                        } else if (askedTopics.pricing && !askedTopics.availability) {
                          suggestions = [
                            "📅 What's available this week?",
                            "💳 Do you offer payment plans?",
                            "🎓 Any package deals?",
                            "📞 Can I speak to someone?",
                          ];
                        } else if (askedTopics.availability && !askedTopics.test) {
                          suggestions = [
                            "📝 How do I book?",
                            "🕐 How long are lessons?",
                            "🎯 When will I be test ready?",
                            "📞 Can I speak to someone?",
                          ];
                        } else if (askedTopics.intensive && !askedTopics.pricing) {
                          suggestions = [
                            "💰 How much is an intensive course?",
                            "⏱️ How long does it take?",
                            "📅 When's the next intensive course?",
                            "🆕 Can beginners do intensive?",
                          ];
                        } else if (askedTopics.beginner && !askedTopics.transmission) {
                          suggestions = [
                            "🚗 Should I learn manual or auto?",
                            "💰 How much are lessons?",
                            "⏱️ How many hours will I need?",
                            "📅 When can I start?",
                          ];
                        } else {
                          const remaining: string[] = [];
                          if (!askedTopics.pricing) remaining.push("💰 How much are lessons?");
                          if (!askedTopics.availability) remaining.push("📅 What's available?");
                          if (!askedTopics.areas) remaining.push("📍 What areas do you cover?");
                          if (!askedTopics.test) remaining.push("🎯 When will I be test ready?");
                          remaining.push("📞 Can I speak to someone?");
                          remaining.push("📝 I'd like to book");
                          suggestions = remaining.slice(0, 4);
                        }

                        return (
                          <div className="flex flex-wrap gap-2 pt-2 px-1">
                            {suggestions.map((suggestion) => (
                              <button
                                key={suggestion}
                                onClick={() => handleSendMessage(suggestion)}
                                className="px-3 py-1.5 text-xs rounded-full border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 transition-colors"
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Bottom input area - context-dependent */}
                    {renderBookingInput()}
                  </>
                )}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
