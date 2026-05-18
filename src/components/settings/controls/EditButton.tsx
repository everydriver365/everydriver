interface Props {
  label: string;
  onClick?: () => void;
  danger?: boolean;
}

export function EditButton({ label, onClick, danger = false }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: `1.5px solid ${danger ? "#FBEAEA" : "#DDE3ED"}`,
        borderRadius: 7, padding: "6px 12px",
        fontSize: 12, fontWeight: 500,
        color: danger ? "#CC2229" : "#374151",
        backgroundColor: "#FFF", cursor: "pointer",
        fontFamily: "inherit",
      }}
    >
      {label}
    </button>
  );
}
