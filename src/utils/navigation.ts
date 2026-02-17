export const navigateTo = (url: string) => {
  if (globalThis.location) {
    globalThis.location.href = url
  }
}
