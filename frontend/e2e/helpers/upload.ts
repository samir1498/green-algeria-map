import { type Page } from '@playwright/test'

export async function uploadPhoto(
  page: Page,
  buffer: Buffer,
  fileName = 'e2e-test.png',
  mimeType = 'image/png',
) {
  const base64 = buffer.toString('base64')
  await page.evaluate(
    ({ base64, fileName, mimeType }) => {
      const binary = atob(base64)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
      const file = new File([bytes], fileName, { type: mimeType })
      ;(window as any).__uploadZonePhoto?.(file)
    },
    { base64, fileName, mimeType },
  )
}

export function createPngBuffer() {
  return Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64',
  )
}
