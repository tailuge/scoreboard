import type { VercelKV } from "@vercel/kv"
import { logger } from "@/utils/logger"

export class Shortener {
  readonly store: VercelKV
  readonly replayUrl = "https://tailuge.github.io/billiards/dist/"
  readonly shortUrl = "https://scoreboard-tailuge.vercel.app/api/replay/"
  readonly notFound = "https://scoreboard-tailuge.vercel.app/notfound.html"
  readonly prefix = "urlkey"

  constructor(store: VercelKV) {
    this.store = store
  }

  async keyFountain() {
    return await this.store.incr("idfountain")
  }

  dbKey(id) {
    return `${this.prefix}${id}`
  }

  async shorten(data: any) {
    if (!data || typeof data.input !== "string" || data.input.length > 2000) {
      logger.error("Invalid input for shorten", data)
      throw new Error("Invalid input")
    }
    const key = (await this.keyFountain()).toString()
    logger.log("next free key: ", key)
    const result = await this.store.set(this.dbKey(key), data)
    logger.log(result)
    return {
      input: data.input,
      key: key,
      shortUrl: this.shortUrl + key,
    }
  }

  async replay(key: string) {
    const data = await this.store.get<any>(this.dbKey(key))
    logger.log(data)
    if (!data || typeof data.input !== "string") {
      return this.notFound
    }
    // Prevent open redirect by ensuring input is not an absolute or protocol-relative URL
    if (data.input.includes("://") || data.input.startsWith("//")) {
      logger.warn(`Blocked potential open redirect: ${data.input}`)
      return this.notFound
    }
    return this.replayUrl + data.input
  }
}
