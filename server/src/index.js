import http from "http";
import { createApp } from "./app.js";
import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";
import { createRedisClients } from "./config/redis.js";
import { initializeSocket } from "./sockets/index.js";
import { createMatchmakingService } from "./services/matchmakingService.js";

const startServer = async () => {
  await connectDb();

  const app = createApp();
  const server = http.createServer(app);
  const redisClients = await createRedisClients();
  const matchmakingService = createMatchmakingService();
  initializeSocket(server, { adapter: redisClients?.adapter, matchmakingService });

  server.listen(env.port, () => {
    console.log(`Server listening on port ${env.port}`);
  });
};

startServer().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
