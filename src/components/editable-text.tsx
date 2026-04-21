import { useEffect } from "react";
import { useTextCustomization, type EditableTextEntry } from "../lib/text-customization";

type EditableTextProps = {
  entry: EditableTextEntry;
  className?: string;
  as?: "h1" | "h2" | "p" | "span";
};

export function EditableText({ entry, className, as = "span" }: EditableTextProps) {
  const { registerEntry, getConfig } = useTextCustomization();
  const config = getConfig(entry);

  useEffect(() => {
    registerEntry(entry);
  }, [entry, registerEntry]);

  const Component = as;

  return (
    <Component
      className={className}
      style={{
        color: config.color,
        fontSize: `${config.size}px`,
        fontFamily: `"${config.font}", "Exo 2", sans-serif`,
        fontWeight: Number(config.weight),
        fontStyle: config.italic ? "italic" : "normal",
        textTransform: config.uppercase ? "uppercase" : "none",
        textShadow: config.glow
          ? `0 0 ${config.glowIntensity}px ${config.glowColor}, 0 0 ${Math.max(8, config.glowIntensity / 2)}px ${config.glowColor}`
          : "none",
      }}
    >
      {config.text}
    </Component>
  );
}