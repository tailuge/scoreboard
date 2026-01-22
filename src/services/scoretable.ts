import { VercelKV } from "@vercel/kv"
import { ScoreData } from "@/types/score"

export class ScoreTable {
  readonly prefix = "hiscore"
  readonly replayUrl = "https://tailuge.github.io/billiards/dist/"
  readonly notFound = "https://scoreboard-tailuge.vercel.app/notfound.html"

  constructor(private readonly store: VercelKV | Partial<VercelKV>) {}

  dbKey(ruletype: string) {
    return `${this.prefix}${ruletype}`
  }

  async add(ruletype: string, score: number, name: string, data: any) {
    const scoreData: ScoreData = {
      name: name,
      score: score,
      data: data,
      likes: 0,
      id: this.generateUID(),
    }
    if (typeof this.store.zadd !== "function") {
      throw new Error("Store is not configured correctly")
    }
    await this.store.zadd(this.dbKey(ruletype), {
      score: score,
      member: scoreData,
    })
    return this.trim(ruletype)
  }

  async trim(ruletype: string) {
    if (typeof this.store.zremrangebyrank !== "function") {
      return
    }
    return await this.store.zremrangebyrank(this.dbKey(ruletype), 0, -11)
  }

  private formatReplayUrl(data: string): string {
    return this.replayUrl + data
  }

  async topTen(ruletype: string) {
    if (typeof this.store.zrange !== "function") {
      return []
    }
    const data = (await this.store.zrange(this.dbKey(ruletype), 0, 9)) as ScoreData[]
    if (!data) {
      return []
    }
    return data.reverse().map((row) => ({
      name: row.name,
      likes: row.likes ?? 0,
      id: row.id,
      score: Math.floor(row.score),
    }))
  }

  async getById(ruletype: string, id: string): Promise<ScoreData | undefined> {
    if (typeof this.store.zrange !== "function") {
      return
    }
    const data = (await this.store.zrange(
      this.dbKey(ruletype),
      0,
      9
    )) as ScoreData[]
    if (!data) {
      return
    }
    return data
      .map((item: any) => ({
        name: item.name,
        score: item.score,
        data: item.data,
        likes: item.likes,
        id: item.id,
      }))
      .find((item: ScoreData) => item.id === id)
  }

  async like(ruletype: string, id: string) {
    console.log("like", ruletype, id)
    const item = await this.getById(ruletype, id)
    if (!item) {
      throw new Error("Item not found")
    }
    console.log("item", item)
    if (typeof this.store.zrem !== "function") {
      throw new Error("Store is not configured correctly")
    }
    await this.store.zrem(this.dbKey(ruletype), item)
    item.likes = (item.likes ?? 0) + 1
    if (typeof this.store.zadd !== "function") {
      throw new Error("Store is not configured correctly")
    }
    await this.store.zadd(this.dbKey(ruletype), {
      score: item.score,
      member: item,
    })
    return item.likes
  }

  async get(ruletype: string, id: string) {
    const item = await this.getById(ruletype, id)
    if (!item) {
      return this.notFound
    }
    return this.formatReplayUrl(item.data)
  }

  generateUID() {
    const a = Math.trunc(Math.random() * 46656)
    const b = Math.trunc(Math.random() * 46656)
    return (
      ("000" + a.toString(36)).slice(-3) + ("000" + b.toString(36)).slice(-3)
    )
  }
}
