import { logger } from "../../infra/logger.js";
import type { MikrotikConnectionParams } from "./mikrotik.client.js";
import { withMikrotikClient } from "./mikrotik.client.js";

export interface HotspotUserPayload {
  name: string;
  password: string;
  profile?: string;
  comment?: string;
  server?: string;
}

export class MikrotikHotspotService {
  constructor(private readonly params: MikrotikConnectionParams) {}

  async addUser(payload: HotspotUserPayload) {
    return withMikrotikClient(this.params, async (client) => {
      const args = [`=name=${payload.name}`, `=password=${payload.password}`];
      if (payload.profile) args.push(`=profile=${payload.profile}`);
      if (payload.comment) args.push(`=comment=${payload.comment}`);
      if (payload.server) args.push(`=server=${payload.server}`);
      await client.write("/ip/hotspot/user/add", args);
      logger.info("Hotspot user criado no MikroTik", { name: payload.name });
    });
  }

  async removeUser(name: string) {
    return withMikrotikClient(this.params, async (client) => {
      const rows = await client.write("/ip/hotspot/user/print", [`?name=${name}`]);
      for (const row of rows) {
        const id = row?.[".id"] as string | undefined;
        if (id) await client.write("/ip/hotspot/user/remove", [`=.id=${id}`]);
      }
    });
  }

  async setBlocked(name: string, blocked: boolean) {
    return withMikrotikClient(this.params, async (client) => {
      const rows = await client.write("/ip/hotspot/user/print", [`?name=${name}`]);
      for (const row of rows) {
        const id = row?.[".id"] as string | undefined;
        if (id) {
          await client.write("/ip/hotspot/user/set", [`=.id=${id}`, `=disabled=${blocked ? "yes" : "no"}`]);
        }
      }
    });
  }

  async setBandwidthProfile(name: string, profile: string) {
    return withMikrotikClient(this.params, async (client) => {
      const rows = await client.write("/ip/hotspot/user/print", [`?name=${name}`]);
      for (const row of rows) {
        const id = row?.[".id"] as string | undefined;
        if (id) await client.write("/ip/hotspot/user/set", [`=.id=${id}`, `=profile=${profile}`]);
      }
    });
  }

  async listSessions() {
    return withMikrotikClient(this.params, async (client) => {
      return client.write("/ip/hotspot/active/print");
    });
  }

  async disconnectByUser(user: string) {
    return withMikrotikClient(this.params, async (client) => {
      const actives = await client.write("/ip/hotspot/active/print", [`?user=${user}`]);
      for (const row of actives) {
        const id = row?.[".id"] as string | undefined;
        if (id) await client.write("/ip/hotspot/active/remove", [`=.id=${id}`]);
      }
    });
  }

  async listHotspotUsers() {
    return withMikrotikClient(this.params, async (client) => {
      return client.write("/ip/hotspot/user/print");
    });
  }
}
