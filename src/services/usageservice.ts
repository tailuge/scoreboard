import { kv, VercelKV } from "@vercel/kv"

export class UsageService {
  constructor(
    private readonly key: string,
    private readonly store: VercelKV | Partial<VercelKV> = kv
  ) {}

  fullKey(): string {
    return this.key + "Usage"
  }
  // Increment the count for day
  async incrementCount(date: number): Promise<void> {
    const day = { date: new Date(date).toISOString().split("T")[0] }
    if (
      typeof this.store.zscore !== "function" ||
      typeof this.store.zadd !== "function"
    ) {
      return
    }
    const currentScore = (await this.store.zscore(this.fullKey(), day)) || 0
    await this.store.zadd(this.fullKey(), {
      score: currentScore + 1,
      member: day,
    })
  }

  async getAllCounts(): Promise<unknown[]> {
    if (typeof this.store.zrange !== "function") {
      return []
    }
    return await this.store.zrange(this.fullKey(), 0, -1, {
      withScores: true,
    })
  }
}
