export function escapeXml(value: string): string {
  // XML 1.0 excludes these control characters even when encoded as entities.
  // eslint-disable-next-line no-control-regex
  return value.replace(/[<>&'"\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, character => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', '\'': '&apos;', '"': '&quot;'
  })[character] || '')
}
