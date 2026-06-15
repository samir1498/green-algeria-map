import { type Locator, type Page } from '@playwright/test'

/**
 * Upload a file to a file input.
 *
 * Fixes CDP staleness by making the input visible before setInputFiles:
 * 1. evaluate() to strip opacity-0 / z-10 styles
 * 2. setInputFiles() with in-memory buffer
 *
 * https://webcrawlerapi.com/glossary/playwright/how-to-fix-playwright-file-upload-setinputfiles
 */
export async function uploadPhoto(
  page: Page,
  buffer: Buffer,
  fileName = 'e2e-test.png',
  mimeType = 'image/png',
) {
  const input = page.getByTestId('file-input')

  // Make the input visible to CDP's node resolution (opacity-0 can
  // cause DOM node ID staleness under parallel workers)
  await input.evaluate((el) => {
    const fileInput = el as HTMLInputElement
    fileInput.style.opacity = '1'
    fileInput.style.position = 'relative'
    fileInput.style.zIndex = '1'
  })

  await input.setInputFiles({ name: fileName, mimeType, buffer })
}

export function createPngBuffer() {
  return Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64',
  )
}