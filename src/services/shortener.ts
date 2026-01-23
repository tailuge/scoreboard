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
    if (!data) {
      return this.notFound
    }
    return this.replayUrl + data.input
  }
}
