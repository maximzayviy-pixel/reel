/** Парсер QR СБП формата ST00012|key=value|... */
export function parseSBPQR(payload: string): { amount?: number, fields: Record<string,string> } {
  const parts = payload.split('|');
  const fields: Record<string,string> = {};
  for (const part of parts) {
    const idx = part.indexOf('=');
    if (idx > 0) {
      const k = part.slice(0, idx);
      const v = part.slice(idx+1);
      fields[k] = decodeURIComponent(v);
    }
  }
  const amount = fields['Amount'] ? parseFloat(fields['Amount'].replace(',', '.')) : undefined;
  return { amount, fields };
}
