export function sanitizeKaggleUrl(input: string): string {
  if (!input) return input;
  const trimmed = input.trim();

  try {
    const parsed = new URL(trimmed);
    const isKaggle = parsed.hostname === 'www.kaggle.com' || parsed.hostname === 'kaggle.com';
    if (isKaggle) {
      // Collapse multiple slashes in the pathname only (preserve protocol //)
      parsed.pathname = parsed.pathname.replace(/\/{2,}/g, '/');
      return parsed.toString();
    }
    return trimmed;
  } catch (e) {
    // Fallback: simple targeted replacements if URL parsing fails
    return trimmed
      .replace('https://www.kaggle.com//', 'https://www.kaggle.com/')
      .replace('https://kaggle.com//', 'https://kaggle.com/');
  }
}


