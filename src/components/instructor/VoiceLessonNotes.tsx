import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Mic, 
  MicOff, 
  Square, 
  Trash2, 
  Check,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface VoiceLessonNotesProps {
  initialValue?: string;
  onSave: (notes: string) => void;
  onCancel?: () => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  handsFree?: boolean;
}

const VoiceLessonNotes: React.FC<VoiceLessonNotesProps> = ({
  initialValue = '',
  onSave,
  onCancel,
  placeholder = 'Start speaking or type your lesson notes...',
  className,
  autoFocus = false,
  handsFree = false,
}) => {
  const [notes, setNotes] = useState(initialValue);
  const [isEditing, setIsEditing] = useState(false);

  const {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
    error,
  } = useVoiceRecognition({
    continuous: true,
    interimResults: true,
    language: 'en-GB',
    onResult: (text, isFinal) => {
      if (isFinal) {
        setNotes(prev => {
          const separator = prev && !prev.endsWith(' ') ? ' ' : '';
          return prev + separator + text;
        });
      }
    },
  });

  // Update notes when transcript changes (for final results)
  useEffect(() => {
    if (transcript && !isListening) {
      setNotes(prev => {
        if (prev.includes(transcript.trim())) return prev;
        const separator = prev && !prev.endsWith(' ') ? ' ' : '';
        return prev + separator + transcript.trim();
      });
    }
  }, [transcript, isListening]);

  // Hands-free: auto-start listening on mount
  useEffect(() => {
    if (handsFree && isSupported && !isListening) {
      resetTranscript();
      startListening();
    }
  }, [handsFree, isSupported]);

  // Hands-free: auto-save after 3s of silence
  const silenceTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (!handsFree || !isListening) return;
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (interimTranscript) return; // still receiving speech
    if (notes.trim()) {
      silenceTimerRef.current = setTimeout(() => {
        stopListening();
        onSave(notes.trim());
      }, 3000);
    }
    return () => { if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current); };
  }, [handsFree, isListening, interimTranscript, notes]);

  const handleToggleVoice = () => {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      startListening();
    }
  };

  const handleClear = () => {
    setNotes('');
    resetTranscript();
  };

  const handleSave = () => {
    if (isListening) {
      stopListening();
    }
    onSave(notes.trim());
  };

  const displayText = notes + (interimTranscript ? (notes ? ' ' : '') + interimTranscript : '');

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-4 space-y-4">
        {/* Voice Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AnimatePresence mode="wait">
              {isListening ? (
                <motion.div
                  key="listening"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-destructive/30 rounded-full animate-ping" />
                    <div className="relative w-3 h-3 bg-destructive rounded-full" />
                  </div>
                  <span className="text-sm font-medium text-destructive">Listening...</span>
                </motion.div>
              ) : (
                <motion.span
                  key="ready"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-sm text-muted-foreground"
                >
                  {isSupported ? 'Tap mic to start voice input' : 'Voice input not available'}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          
          {notes.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {notes.split(/\s+/).filter(Boolean).length} words
            </Badge>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 p-2 rounded-2xl bg-destructive/10 text-destructive text-sm"
          >
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Notes Input */}
        <div className="relative">
          <Textarea
            value={displayText}
            onChange={(e) => {
              setNotes(e.target.value);
              setIsEditing(true);
            }}
            onFocus={() => setIsEditing(true)}
            onBlur={() => setIsEditing(false)}
            placeholder={placeholder}
            className={cn(
              "min-h-[150px] resize-none transition-all",
              isListening && "ring-2 ring-destructive/50 bg-destructive/5"
            )}
            autoFocus={autoFocus}
          />
          
          {/* Interim transcript indicator */}
          {interimTranscript && (
            <div className="absolute bottom-2 left-2 flex items-center gap-1 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Processing...</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {/* Main Voice Button */}
            <Button
              type="button"
              variant={isListening ? "destructive" : "outline"}
              size="lg"
              onClick={handleToggleVoice}
              disabled={!isSupported}
              className={cn(
                "relative transition-all",
                isListening && "animate-pulse"
              )}
            >
              {isListening ? (
                <>
                  <Square className="h-5 w-5 mr-2" />
                  Stop
                </>
              ) : (
                <>
                  <Mic className="h-5 w-5 mr-2" />
                  Voice
                </>
              )}
            </Button>

            {/* Clear Button */}
            {notes.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleClear}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onCancel && (
              <Button
                type="button"
                variant="ghost"
                onClick={onCancel}
              >
                Cancel
              </Button>
            )}
            
            <Button
              type="button"
              onClick={handleSave}
              disabled={!notes.trim()}
            >
              <Check className="h-4 w-4 mr-2" />
              Save Notes
            </Button>
          </div>
        </div>

        {/* Voice Tips */}
        {!isListening && !notes && isSupported && (
          <div className="text-xs text-muted-foreground bg-muted/50 rounded-2xl p-3">
            <p className="font-medium mb-1">💡 Voice Input Tips:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Speak clearly and at a normal pace</li>
              <li>Say "full stop" or "comma" for punctuation</li>
              <li>You can edit the text after recording</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VoiceLessonNotes;
