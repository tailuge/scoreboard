import { VercelKV } from "@vercel/kv"

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
    console.log("next free key: ", key)
    const result = await this.store.set(this.dbKey(key), data)
    console.log(result)
    return {
      input: data.input,
      key: key,
      shortUrl: this.shortUrl + key,
    }
  }

  async replay(key: string) {
    const full = this.dbKey(key)
    console.log(full)
    const item: { input } = await this.store.get(full)
    console.log(item)
    if (item?.input) {
      return this.replayUrl + item.input
    }
    return this.notFound
  }
}
