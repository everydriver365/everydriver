import { Calendar } from "lucide-react";
import { lessonsTokens as t } from "./tokens";

interface Props {
  onClick: () => void;
}

export function BookNewLessonButton({ onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-center gap-2.5 transition-opacity active:opacity-85"
      style={{
        backgroundColor: t.red,
        color: t.white,
        borderRadius: 12,
        padding: '15px 20px',
        fontFamily: 'Poppins, system-ui, sans-serif',
        fontSize: 15,
        fontWeight: 600,
        letterSpacing: '-0.1px',
      }}
    >
      <Calendar size={18} strokeWidth={1.8} />
      Book a New Lesson
    </button>
  );
}
