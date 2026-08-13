/** Hands a generated file to the browser as a download. */
export function saveBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  link.remove()
  // Give the browser a tick to start the download before releasing the handle.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
