import { Check, Circle } from "lucide-react";
import { PASSWORD_RULES } from "../validation";

interface PasswordChecklistProps {
  id: string;
  password: string;
}

/** Visible password policy; each rule reads "cumplido" / "pendiente" for screen readers. */
function PasswordChecklist({ id, password }: PasswordChecklistProps) {
  return (
    <ul id={id} className="grid grid-cols-1 gap-x-4 gap-y-1 text-xs leading-[18px] sm:grid-cols-2">
      {PASSWORD_RULES.map((rule) => {
        const met = rule.test(password);
        const Icon = met ? Check : Circle;
        return (
          <li key={rule.id} className={`flex items-center gap-1.5 ${met ? "text-cyan" : "text-ink-subtle"}`}>
            <Icon aria-hidden="true" className={met ? "size-3.5" : "size-2.5"} />
            {rule.label}
            <span className="sr-only">{met ? ": cumplido" : ": pendiente"}</span>
          </li>
        );
      })}
    </ul>
  );
}

export default PasswordChecklist;
