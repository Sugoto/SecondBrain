import { useEffect, useState } from "react";

function read<T extends string>(names: readonly T[]): Record<T, string> {
  const style = getComputedStyle(document.documentElement);
  return Object.fromEntries(
    names.map((name) => [name, style.getPropertyValue(name).trim()]),
  ) as Record<T, string>;
}

export function useCssVars<T extends string>(names: readonly T[], theme: string) {
  const [values, setValues] = useState(() => read(names));
  useEffect(() => {
    const frame = requestAnimationFrame(() => setValues(read(names)));
    return () => cancelAnimationFrame(frame);
  }, [names, theme]);
  return values;
}
