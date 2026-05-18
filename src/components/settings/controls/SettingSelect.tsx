interface Option { value: string; label: string }
interface Props {
  value: string;
  onChange: (v: string) => void;
  options: Option[];
}

export function SettingSelect({ value, onChange, options }: Props) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        border: "1.5px solid #DDE3ED", borderRadius: 8,
        padding: "7px 28px 7px 10px", fontSize: 12,
        color: "#0F2044", backgroundColor: "#FFF",
        fontFamily: "inherit", outline: "none",
        appearance: "none", cursor: "pointer",
      }}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}
