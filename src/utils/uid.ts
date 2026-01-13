export function getUID() {
  return Math.random().toString(36).substring(2, 10)
}
