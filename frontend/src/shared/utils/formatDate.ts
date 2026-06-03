export function formatDate(date: string | Date, locale?: string): string {
  return new Date(date).toLocaleDateString(locale ?? 'en-US')
}
