export function evaluateFreshness(context, nowIso = new Date().toISOString().slice(0,10)) {
  if (!context) return { valid: true, reason: '' };
  if (context.validFrom && nowIso < context.validFrom) return { valid: false, reason: 'Site content not yet valid.' };
  if (context.validUntil && nowIso > context.validUntil) return { valid: false, reason: 'Site content expired.' };
  return { valid: true, reason: '' };
}
