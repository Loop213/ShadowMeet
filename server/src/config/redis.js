import Redis from "ioredis";
import { createAdapter } from "@socket.io/redis-adapter";
import { env } from "./env.js";

const normalizeRedisUrl = (value = "") => {
  if (!value) return "";

  let normalized = decodeURIComponent(String(value).trim());
  normalized = normalized.replace(/^['"]|['"]$/g, "");

  // Common copy/paste mistake: "redis-cli -u redis://..."
  if (normalized.startsWith("redis-cli")) {
    const match = normalized.match(/(rediss?:\/\/\S+)/);
    normalized = match ? match[1] : "";
  }

  normalized = normalized.replace(/^-u\s+/i, "");
  normalized = normalized.trim();

  return normalized;
};

export const createRedisClients = async () => {
  const redisUrl = normalizeRedisUrl(env.redisUrl);

  if (!redisUrl) {
    return null;
  }

  try {
    const pubClient = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      lazyConnect: true,
      enableOfflineQueue: false,
      retryStrategy: (attempt) => Math.min(attempt * 250, 5000),
    });
    const subClient = pubClient.duplicate();

    pubClient.on("error", (error) => {
      console.warn("Redis pub client error:", error.message);
    });
    subClient.on("error", (error) => {
      console.warn("Redis sub client error:", error.message);
    });

    await Promise.all([pubClient.connect(), subClient.connect()]);
    return { pubClient, subClient, adapter: createAdapter(pubClient, subClient) };
  } catch (error) {
    // Socket.IO should still run in single-instance mode when Redis is unavailable.
    console.warn("Redis unavailable. Continuing without Redis adapter:", error.message);
    return null;
  }
};
