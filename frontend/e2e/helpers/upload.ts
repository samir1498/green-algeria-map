import { type Page } from '@playwright/test'

export async function uploadPhoto(
  page: Page,
  buffer: Buffer,
  fileName = 'e2e-test.png',
  mimeType = 'image/png',
) {
  const input = page.getByTestId('file-input')
  await input.scrollIntoViewIfNeeded()
  await input.evaluate((el) => { (el as HTMLElement).style.opacity = '1' })
  await input.setInputFiles({ name: fileName, mimeType, buffer })
}

export function createPngBuffer() {
  return Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64',
  )
}
