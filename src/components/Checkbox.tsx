import { CheckIcon } from "../icons";

interface CheckboxProps {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export const Checkbox = ({ checked, label, onChange, disabled = false }: CheckboxProps) => (
  <label className="check-control">
    <input
      type="checkbox"
      checked={checked}
      disabled={disabled}
      onChange={(event) => onChange(event.target.checked)}
      aria-label={label}
    />
    <span className="check-visual" aria-hidden="true">
      {checked ? <CheckIcon size={18} /> : null}
    </span>
  </label>
);
