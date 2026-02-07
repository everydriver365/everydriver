import messagesIcon from "@/assets/messages-icon.png";

interface MessagesIconProps {
  className?: string;
}

export function MessagesIcon({ className }: MessagesIconProps) {
  return (
    <img src={messagesIcon} alt="Messages" className={className} />
  );
}
