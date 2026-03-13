export async function shareContent(options: {
  title: string;
  text: string;
  url?: string;
}): Promise<boolean> {
  if (navigator.share) {
    try {
      await navigator.share(options);
      return true;
    } catch {
      return false; // User cancelled
    }
  }

  // Fallback: copy text to clipboard
  const content = [options.text, options.url].filter(Boolean).join("\n");
  try {
    await navigator.clipboard.writeText(content);
    return true;
  } catch {
    return false;
  }
}
