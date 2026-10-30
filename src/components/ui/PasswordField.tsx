import { useState, type ComponentProps } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import FormField from "./FormField";

type PasswordFieldProps = Omit<ComponentProps<typeof FormField>, "type" | "trailing" | "icon">;

/** Password input with a show/hide toggle; paste and password managers stay allowed (WCAG 3.3.8). */
function PasswordField(props: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const ToggleIcon = visible ? EyeOff : Eye;

  return (
    <FormField
      {...props}
      type={visible ? "text" : "password"}
      icon={Lock}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-pressed={visible}
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          className="grid size-9 place-items-center rounded-md text-ink-subtle transition-colors duration-150 hover:bg-surface-raised hover:text-ink"
        >
          <ToggleIcon aria-hidden="true" className="size-[18px]" />
        </button>
      }
    />
  );
}

export default PasswordField;
