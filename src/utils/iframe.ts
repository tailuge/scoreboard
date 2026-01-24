export const isInsideIframe = () => {
  try {
    return globalThis.self !== globalThis.top
  } catch {
    return true
  }
}
