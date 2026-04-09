export type ClientLog = {
  type: string
  message: string
  stack?: string
  url?: string
  ts: number
  sid: string
  online?: boolean
  viewport?: string
  ua?: string
  region?: string
  city?: string
  country?: string
  version?: string
  origin?: string
}

export type SessionEntry = {
  sid: string
  ua: string
  ts: number
  logs: ClientLog[]
  online?: boolean
  viewport?: string
  city?: string
  country?: string
  region?: string
  version?: string
  origin?: string
}
