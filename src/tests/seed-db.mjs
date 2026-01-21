// src/tests/seed-db.mjs
import { Redis } from 'ioredis';

async function seedData() {
  const redis = new Redis(); // Uses mockkv by default in this test env
  console.log('Connecting to mock Redis to seed data...');

  try {
    await redis.flushall();
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
        promises.push(redis.zadd(key, score, date));
      }
    }

    await Promise.all(promises);
    console.log('Seeding complete.');

  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    redis.disconnect();
    console.log('Redis connection closed.');
  }
}

seedData();
