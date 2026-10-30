import { useId } from "react";
import { AVATARS } from "../avatars";

interface AvatarOption {
  url: string;
  label: string;
}

interface AvatarPickerProps {
  value: string;
  onChange: (url: string) => void;
  /** Extra first option, e.g. the Google profile photo. */
  extraOption?: AvatarOption;
}

/**
 * Avatar gallery as a native radio group: arrow keys move between options and the
 * screen reader announces "Avatar, Órbita violeta, 1 de 8, seleccionado".
 */
function AvatarPicker({ value, onChange, extraOption }: AvatarPickerProps) {
  const name = useId();
  const options: readonly AvatarOption[] = extraOption ? [extraOption, ...AVATARS] : AVATARS;

  return (
    <fieldset className="flex flex-col gap-2 text-left">
      <legend className="mb-2 text-sm font-semibold tracking-[0.01em] text-ink">Avatar</legend>
      <div className="flex flex-wrap gap-2.5">
        {options.map((option) => {
          const selected = option.url === value;
          return (
            <label key={option.url} className="group relative cursor-pointer" title={option.label}>
              <input
                type="radio"
                name={name}
                value={option.url}
                checked={selected}
                onChange={() => onChange(option.url)}
                className="peer sr-only"
              />
              <span className="sr-only">{option.label}</span>
              <img
                src={option.url}
                alt=""
                width={44}
                height={44}
                referrerPolicy="no-referrer"
                className={`size-11 rounded-full object-cover ring-2 ring-offset-2 ring-offset-surface transition-[box-shadow,transform] duration-150 ease-out group-active:scale-95 peer-focus-visible:outline-3 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-cyan ${
                  selected ? "ring-violet" : "ring-transparent group-hover:ring-line-field"
                }`}
              />
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export default AvatarPicker;
