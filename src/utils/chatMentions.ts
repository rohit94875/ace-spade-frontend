/** Extract @mentions that match known room usernames (longest match first). */
export function extractMentions(text: string, usernames: string[]): string[] {
  if (!text.includes('@') || usernames.length === 0) return [];
  const sorted = [...usernames].sort((a, b) => b.length - a.length);
  const found: string[] = [];
  let i = 0;
  while (i < text.length) {
    if (text[i] === '@') {
      let matched = false;
      for (const name of sorted) {
        const afterAt = text.slice(i + 1, i + 1 + name.length);
        if (afterAt === name) {
          const next = i + 1 + name.length;
          if (next >= text.length || text[next] === ' ' || text[next] === '\n') {
            if (!found.includes(name)) found.push(name);
            i = next;
            matched = true;
            break;
          }
        }
      }
      if (!matched) i += 1;
    } else {
      i += 1;
    }
  }
  return found;
}

/** Split text into plain and @mention segments for rendering. */
export function renderMentionParts(
  text: string,
  usernames: string[],
): Array<{ type: 'text' | 'mention'; value: string }> {
  if (!text.includes('@') || usernames.length === 0) {
    return [{ type: 'text', value: text }];
  }
  const sorted = [...usernames].sort((a, b) => b.length - a.length);
  const parts: Array<{ type: 'text' | 'mention'; value: string }> = [];
  let i = 0;
  while (i < text.length) {
    if (text[i] === '@') {
      let matched = false;
      for (const name of sorted) {
        const afterAt = text.slice(i + 1, i + 1 + name.length);
        if (afterAt === name) {
          const next = i + 1 + name.length;
          if (next >= text.length || text[next] === ' ' || text[next] === '\n') {
            parts.push({ type: 'mention', value: `@${name}` });
            i = next;
            matched = true;
            break;
          }
        }
      }
      if (!matched) {
        parts.push({ type: 'text', value: text[i] });
        i += 1;
      }
    } else {
      const start = i;
      while (i < text.length && text[i] !== '@') i += 1;
      parts.push({ type: 'text', value: text.slice(start, i) });
    }
  }
  return parts.length ? parts : [{ type: 'text', value: text }];
}

/** Active @mention query at cursor, or null. */
export function mentionQueryAtCursor(text: string, cursor: number): string | null {
  const before = text.slice(0, cursor);
  const at = before.lastIndexOf('@');
  if (at < 0) return null;
  const fragment = before.slice(at + 1);
  if (fragment.includes(' ') || fragment.includes('\n')) return null;
  return fragment;
}
