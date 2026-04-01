import Redis from "ioredis";
import { createAdapter } from "@socket.io/redis-adapter";
import { env } from "./env.js";

export const createRedisClients = async () => {
  if (!env.redisUrl) {
    return null;
  }

  const pubClient = new Redis(env.redisUrl, {
    maxRetriesPerRequest: null,
    lazyConnect: true,
  });
  const subClient = pubClient.duplicate();

  await Promise.all([pubClient.connect(), subClient.connect()]);
  return { pubClient, subClient, adapter: createAdapter(pubClient, subClient) };
};
