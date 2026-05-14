import { RouterOSAPI } from "node-routeros";
import { logger } from "../../infra/logger.js";

export interface MikrotikConnectionParams {
  host: string;
  port: number;
  user: string;
  password: string;
}

/**
 * Executa callback com RouterOS API conectada (node-routeros — nível `write`).
 */
export async function withMikrotikClient<T>(
  params: MikrotikConnectionParams,
  fn: (client: RouterOSAPI) => Promise<T>,
): Promise<T> {
  const client = new RouterOSAPI({
    host: params.host,
    user: params.user,
    password: params.password,
    port: params.port,
    keepalive: true,
  });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    try {
      await client.close();
    } catch (e) {
      logger.warn("Erro ao fechar MikroTik", { e });
    }
  }
}

export async function testConnection(params: MikrotikConnectionParams) {
  return withMikrotikClient(params, async (client) => {
    const rows = await client.write("/system/identity/print");
    return { ok: true as const, identity: rows[0] ?? null };
  });
}
