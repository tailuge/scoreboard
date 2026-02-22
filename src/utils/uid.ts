export function getUID() {
  return globalThis.crypto.randomUUID().split("-")[0]
}
