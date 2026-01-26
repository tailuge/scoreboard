import RedisMock from "ioredis-mock"
import { VercelKV } from "@vercel/kv"
import { logger } from "../utils/logger"

// Create an adapter class for Vercel KV
export class MockKV {
  private readonly mockRedis: InstanceType<typeof RedisMock>

  constructor() {
    this.mockRedis = new RedisMock()
  }

  /**
   * Adapter function to match @vercel/kv's zadd signature using ioredis-mock's zadd.
   * @param key - The name of the sorted set.
   * @param scoreMembers - An array of objects containing score and member.
   * @returns A promise that resolves to the number of elements added to the sorted set.
   */
  async zadd<TData>(
    ...args:
      | [
          key: string,
          scoreMember: { score: number; member: TData },
          ...scoreMemberPairs: { score: number; member: TData }[],
        ]
      | [
          key: string,
          opts: any,
          scoreMember: { score: number; member: TData },
          ...scoreMemberPairs: { score: number; member: TData }[],
        ]
  ): Promise<number> {
    const [key, ...rest] = args
    let scoreMembers: { score: number; member: TData }[]

    if (typeof rest[0] === "object" && "score" in rest[0]) {
      scoreMembers = rest as { score: number; member: TData }[]
    } else {
      scoreMembers = rest.slice(1) as { score: number; member: TData }[]
    }

    const redisArgs: (string | number)[] = []
    for (const { score, member } of scoreMembers) {
      redisArgs.push(score, JSON.stringify(member))
    }

    return this.mockRedis.zadd(key, ...redisArgs)
  }

  /**
   * Adapter function to match @vercel/kv's zrange signature using ioredis-mock's zrange.
   * @param key - The name of the sorted set.
   * @param start - The starting index.
   * @param stop - The stopping index.
   * @param options - Optional parameters to include scores.
   * @returns A promise that resolves to an array of members or an array of [member, score] tuples.
   */
  async zrange(
    key: string,
    start: number,
    stop: number,
    options?: { withScores?: boolean; rev?: boolean }
  ): Promise<any> {
    // Determine if scores should be included
    const withScores = options?.withScores ?? false
    const rev = options?.rev ?? false

    // Call ioredis-mock's zrange/zrevrange with or without 'WITHSCORES'
    const command = rev ? "zrevrange" : "zrange"
    const result = withScores
      ? await this.mockRedis[command](key, start, stop, "WITHSCORES")
      : await this.mockRedis[command](key, start, stop)

    return result.map((item) => {
      try {
        return JSON.parse(item)
      } catch {
        // Return original if not valid JSON
        return item
      }
    })
  }

  /**
   * Adapter function to match @vercel/kv's zremrangebyrank signature using ioredis-mock's zremrangebyrank.
   * @param key - The name of the sorted set.
   * @param start - The starting rank.
   * @param stop - The stopping rank.
   * @returns A promise that resolves to the number of elements removed from the sorted set.
   */
  async zremrangebyrank(
    key: string,
    start: number,
    stop: number
  ): Promise<number> {
    // Call ioredis-mock's zremrangebyrank with the provided parameters
    return this.mockRedis.zremrangebyrank(key, start, stop)
  }

  /**
   * Adapter function to match @vercel/kv's zrem signature using ioredis-mock's zrem.
   * @param key - The name of the sorted set.
   * @param members - Members to remove from the sorted set.
   * @returns A promise that resolves to the number of members removed.
   */
  async zrem(key: string, ...members: any[]): Promise<number> {
    // Convert members to strings to match ioredis-mock format
    const stringMembers = members.map((member) => JSON.stringify(member))

    // Call ioredis-mock's zrem with the prepared arguments
    return this.mockRedis.zrem(key, ...stringMembers)
  }

  async zscore<TData>(key: string, member: TData): Promise<number | null> {
    // Convert member to string to match ioredis-mock format
    const stringMember = JSON.stringify(member)

    // Call ioredis-mock's zscore with the stringified member
    const score = await this.mockRedis.zscore(key, stringMember)

    // Return null if no score found, otherwise return the parsed number
    return score === null ? null : Number.parseFloat(score)
  }

  /**
   * Adapter function to match @vercel/kv's hset signature using ioredis-mock's hset.
   * @param key - The name of the hash.
   * @param field - The field to set.
   * @param value - The value to set.
   * @returns A promise that resolves to the number of fields added.
   */
  async hset<TData>(key: string, kv: Record<string, TData>): Promise<number> {
    const fieldValuePairs: [string, string][] = Object.entries(kv).map(
      ([field, value]) => [field, JSON.stringify(value)]
    )
    return this.mockRedis.hset(key, ...fieldValuePairs.flat())
  }

  /**
   * Adapter function to match @vercel/kv's hget signature using ioredis-mock's hget.
   * @param key - The name of the hash.
   * @param field - The field to retrieve.
   * @returns A promise that resolves to the value of the field.
   */
  async hget(key: string, field: string): Promise<any> {
    // Call ioredis-mock's hget to retrieve the value
    const value = await this.mockRedis.hget(key, field)

    // Parse the stringified JSON back into an object
    try {
      return JSON.parse(value)
    } catch {
      // Return original if not valid JSON
      return value
    }
  }

  /**
   * Adapter function to match @vercel/kv's hgetall signature using ioredis-mock's hgetall.
   * @param key - The name of the hash.
   * @returns A promise that resolves to an object containing all fields and values.
   */
  async hgetall<
    TData extends Record<string, unknown> = Record<string, unknown>,
  >(key: string): Promise<TData> {
    // Call ioredis-mock's hgetall to retrieve all fields and values
    const result = await this.mockRedis.hgetall(key)

    // Parse the stringified JSON values back into objects
    const parsedResult: Record<string, unknown> = {}
    for (const [field, value] of Object.entries(result)) {
      try {
        parsedResult[field] = JSON.parse(value)
      } catch {
        // Return original if not valid JSON
        parsedResult[field] = value
      }
    }

    return parsedResult as TData
  }

  /**
   * Adapter function to match @vercel/kv's hdel signature using ioredis-mock's hdel.
   * @param key - The name of the hash.
   * @param fields - The fields to delete from the hash.
   * @returns A promise that resolves to the number of fields removed.
   */
  async hdel(key: string, ...fields: string[]): Promise<0 | 1> {
    const result = await this.mockRedis.hdel(key, ...fields)
    return result === 0 ? 0 : 1
  }

  async printMockRedisData() {
    try {
      // Retrieve all keys
      const keys = await this.mockRedis.keys("*")

      // Iterate over each key and retrieve its value
      for (const key of keys) {
        // Determine the type of the key to handle it appropriately
        const type = await this.mockRedis.type(key)

        let value
        switch (type) {
          case "string":
            value = await this.mockRedis.get(key)
            break
          case "hash":
            value = await this.mockRedis.hgetall(key)
            break
          case "list":
            value = await this.mockRedis.lrange(key, 0, -1)
            break
          case "set":
            value = await this.mockRedis.smembers(key)
            break
          case "zset":
            value = await this.mockRedis.zrange(key, 0, -1, "WITHSCORES")
            break
          default:
            value = "Unknown type"
        }

        logger.log(`Key: ${key}, Type: ${type}, Value:`, value)
      }
    } catch (error) {
      console.error("Error retrieving data from mockRedis:", error)
    }
  }

  async flushall(): Promise<"OK"> {
    return this.mockRedis.flushall() as Promise<"OK">
  }

  /**
   * Adapter function to match @vercel/kv's set signature using ioredis-mock's set.
   */
  async set(key: string, value: any): Promise<any> {
    const stringValue = JSON.stringify(value)
    // Basic support for opts if needed in future, currently just simple set
    return this.mockRedis.set(key, stringValue)
  }

  /**
   * Adapter function to match @vercel/kv's get signature using ioredis-mock's get.
   */
  async get<TData>(key: string): Promise<TData | null> {
    const value = await this.mockRedis.get(key)
    if (value === null) return null
    try {
      return JSON.parse(value)
    } catch {
      return value as any
    }
  }

  /**
   * Adapter function to match @vercel/kv's incr signature using ioredis-mock's incr.
   */
  async incr(key: string): Promise<number> {
    return this.mockRedis.incr(key)
  }
}

export const mockKv: Partial<VercelKV> = new MockKV()
