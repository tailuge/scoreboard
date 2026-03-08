export type ClientLog = {
  type: string
  message: string
  stack?: string
  url?: string
  ts: number
  sid: string
  ua?: string
  region?: string
  city?: string
  country?: string
}

export type SessionEntry = {
  sid: string
  ua: string
  ts: number
  logs: ClientLog[]
  city?: string
  country?: string
  region?: string
}
