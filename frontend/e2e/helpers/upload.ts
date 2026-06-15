import { type Locator } from '@playwright/test'

/**
 * Upload a file via setInputFiles, making the input visible first.
 *
 * The file input has `opacity-0 z-10 absolute inset-0` for visual overlay.
 * CDP's DOM.setFileInputFiles can fail on invisible inputs under parallel
 * load. Making the input visible first avoids this CDP code path entirely.
 *
 * https://webcrawlerapi.com/glossary/playwright/how-to-fix-playwright-file-upload-setinputfiles
 */
export async function uploadTo(input: Locator, buffer: Buffer, fileName: string, mimeType: string) {
  // Remove opacity-0 / hidden styles so CDP can resolve the input's node path
  await input.evaluate((el) => {
    const input = el as HTMLInputElement
    input.style.opacity = '1'
    input.style.position = 'relative'
    input.style.zIndex = '1'
  })

  await input.setInputFiles({ name: fileName, mimeType, buffer })
}