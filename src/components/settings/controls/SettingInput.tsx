interface Props {
  value: string;
  onChange: (v: string) => void;
  type?: string;
  width?: number;
  placeholder?: string;
}

export function SettingInput({
  value, onChange, type = "text", width = 150, placeholder,
}: Props) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        border: "1.5px solid #DDE3ED", borderRadius: 8,
        padding: "7px 10px", fontSize: 12,
        color: "#0F2044", backgroundColor: "#FFF",
        fontFamily: "inherit", outline: "none", width,
      }}
      onFocus={e => (e.target.style.borderColor = "#1A52A0")}
      onBlur={e => (e.target.style.borderColor = "#DDE3ED")}
    />
  );
}
