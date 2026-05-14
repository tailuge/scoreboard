import { kv, VercelKV } from "@vercel/kv"

export class UsageService {
  constructor(
    private readonly key: string,
    private readonly store: VercelKV | Partial<VercelKV> = kv
  ) {
    if (!/^[a-zA-Z0-9_-]+$/.test(key)) {
      throw new Error("Invalid metric name")
    }
  }

  fullKey(): string {
    return this.key + "Usage"
  }
  // Increment the count for day
  async incrementCount(date): Promise<void> {
    const day = { date: new Date(date).toISOString().split("T")[0] }

    // Use zincrby to perform the increment in a single roundtrip
    await this.store.zincrby!(this.fullKey(), 1, day)
  }

  async getAllCounts(): Promise<unknown[]> {
    return await this.store.zrange(this.fullKey(), 0, -1, {
      withScores: true,
    })
  }
}
