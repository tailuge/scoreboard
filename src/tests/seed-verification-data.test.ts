// src/tests/seed-verification-data.test.ts
import { kv } from '@vercel/kv';

describe('Seed Verification Data', () => {
  it('should seed the database with sample usage data', async () => {
    console.log('Seeding data for verification...');

    // In the test environment, @vercel/kv is mocked by ioredis-mock
    // No need to connect manually, it's handled by the jest setup.

    await kv.flushall();
    console.log('Flushed old data.');

    const metrics = ['lobby', 'createTable', 'joinTable', 'game'];
    const promises = [];

    for (const metric of metrics) {
      const key = `usage:v2:${metric}`;
      console.log(`Seeding metric: ${key}`);
      for (let i = 0; i < 20; i++) {
        const day = String(i + 1).padStart(2, '0');
        const date = `2024-01-${day}`;
        const score = Math.floor(Math.random() * 25) + i * 5 + 5;
        promises.push(kv.zadd(key, { score, member: date }));
      }
    }

    await Promise.all(promises);
    console.log('Seeding complete.');
  });
});
