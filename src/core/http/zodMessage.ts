export function zodFirstMessage(err: unknown): string {
  const anyErr = err as any;
  const msg = anyErr?.issues?.[0]?.message;
  return typeof msg === "string" ? msg : "بيانات غير صالحة";
}
