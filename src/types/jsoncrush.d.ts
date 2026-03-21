declare module "jsoncrush" {
  export function crush(str: string): string
  export function uncrush(str: string): string
  const JSONCrush: {
    crush: typeof crush
    uncrush: typeof uncrush
  }
  export default JSONCrush
}
