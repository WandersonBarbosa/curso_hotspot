import "dotenv/config";
import http from "node:http";
import { WebSocketServer, type WebSocket } from "ws";
import { createApp } from "./app.js";
import { loadConfig } from "./config/env.js";
import { logger } from "./infra/logger.js";
import { createPaymentWorker } from "./jobs/queues.js";
import { processPaidPaymentByExternalId } from "./modules/payments/payment.processor.js";

const cfg = loadConfig();
const app = createApp(cfg);
const server = http.createServer(app);

const wss = new WebSocketServer({ server, path: "/ws" });

wss.on("connection", (socket: WebSocket) => {
  socket.send(JSON.stringify({ type: "welcome", message: "Hotspot SaaS realtime" }));
  socket.on("message", (raw: Buffer | ArrayBuffer | Buffer[]) => {
    try {
      const msg = JSON.parse(String(raw)) as { type?: string; companyId?: string };
      if (msg.type === "ping") socket.send(JSON.stringify({ type: "pong" }));
    } catch {
      socket.send(JSON.stringify({ type: "error", message: "JSON inválido" }));
    }
  });
});

const paymentWorker = createPaymentWorker(async (name, data) => {
  if (name === "pix-paid") {
    const paidAt = new Date(String(data.paidAt));
    await processPaidPaymentByExternalId(String(data.externalPaymentId), paidAt);
  }
});
paymentWorker.on("failed", (job, err) => {
  logger.error("Job falhou", { jobId: job?.id, err });
});

const port = cfg.PORT;
server.listen(port, () => {
  logger.info(`API ouvindo na porta ${port}`);
});

export { server, wss };
