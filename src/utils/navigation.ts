export const navigateTo = (url: string) => {
  if (url && globalThis.location) {
    globalThis.location.href = url
  }
}
