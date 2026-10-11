/** Formato único de los catálogos de Control de Almacén. */
export function cleanSpaces(value: string | null | undefined): string {
  return String(value ?? "").normalize("NFKC").trim().replace(/\s+/g, " ");
}

export function normalizeCode(value: string | null | undefined): string {
  return cleanSpaces(value).toUpperCase();
}

/** Convierte nombres y descripciones a mayúscula inicial por palabra. */
export function titleCase(value: string | null | undefined): string {
  return cleanSpaces(value)
    .toLocaleLowerCase("es-PE")
    .split(/([\s-]+)/)
    .map((part) => /^[a-záéíóúüñ0-9]/i.test(part) ? part.charAt(0).toLocaleUpperCase("es-PE") + part.slice(1) : part)
    .join("");
}

export function normalizeName(value: string | null | undefined): string {
  return titleCase(value);
}

export function normalizeDescription(value: string | null | undefined): string {
  return titleCase(value);
}

export function normalizeBrand(value: string | null | undefined): string | undefined {
  const result = cleanSpaces(value);
  return result ? result.toUpperCase() : undefined;
}

export function normalizeLocation(value: string | null | undefined): string | undefined {
  const result = cleanSpaces(value);
  return result ? result.toUpperCase() : undefined;
}

export function normalizeType(value: string | null | undefined): string {
  return titleCase(value);
}
