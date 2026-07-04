/**
 * Effect Display Formatter
 *
 * Filters out raw parser tokens that leak through the data pipeline
 * before they reach the user-facing selectors. Raw data is preserved
 * internally — this only formats text for display purposes.
 */

const RAW_TOKEN_PATTERNS = [
  /[A-Za-z]\+%/,           // stat label with +% but no numeric value — "Damage+%"
  /\d+seconds?/i,         // unseparated duration like "2seconds"
  /Duration\d+/i,         // Duration without space "Duration7"
  /Trigger\s*\d+/i,       // Trigger without context "Trigger2"
  /Range\s*\/\s*Area/i,   // raw range/area tokens "Range / Area"
  /Target\d+/i,           // Target without space "Target7"
  /Reload\d+%/i,          // Reload without space "Reload100%"
  /stacks【】/,            // Chinese bracket artifacts
  /【】/,                   // Chinese brackets alone
  /^[A-Z][a-z]+\d+%\s*[A-Z]/, // "Movement Speed30% Duration" — stat run-on
];

/**
 * Returns true when the text looks like a raw parser token dump
 * that shouldn't be shown to users as-is.
 */
export function isRawTokenDescription(text: string): boolean {
  return RAW_TOKEN_PATTERNS.some(p => p.test(text));
}

/**
 * Formats an effect summary for display, suppressing raw token noise.
 * Never invents content — either shows the original or a safe fallback message.
 */
export function formatEffectForDisplay(
  effectSummary: string | undefined | null,
  confidence?: string
): string {
  if (!effectSummary) return "";
  if (isRawTokenDescription(effectSummary)) {
    if (confidence === 'placeholder' || confidence === 'experimental') {
      return "Effect data pending verification";
    }
    return "Estimated modifiers available — description not verified";
  }
  return effectSummary;
}
