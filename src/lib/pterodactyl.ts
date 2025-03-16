import axios, { AxiosInstance } from "axios";
import { config } from "../config.js";
import chalk from "chalk";
import { Collection } from "discord.js";
export enum StatusCode {
  SUCCESS,
  NOT_FOUND,
  RATE_LIMITED,
}
export class Pterodactyl {
  public client: AxiosInstance;
  public url: string;
  public apiKey: string;
  public servers: Server[] = [];
  public webhookEnabledServers: {
    serverId: string;
    channelId: string;
    token: string;
    url: string;
    serverStatusEnabled: boolean;
    consoleRelayEnabled: boolean;
  }[] = [];
  public constructor(url?: string, apiKey?: string) {
    this.url = url || config.pterodactylSettings.url;
    this.apiKey = apiKey || config.pterodactylSettings.apiKey;
    this.client = axios.create({
      baseURL: `${this.url}/api/client`,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    this.init();
  }
  public async init() {
    console.log(
      chalk.gray(`| ${chalk.red("Pterodactyl")}: Loading servers...`)
    );
    const res = await this.client.get<ServersResponse>("/");
    if (!res.status.toString().startsWith("2"))
      throw new Error(`Server errored with status: ${res.statusText}`);
    const servers = res.data.data.map((server) => server.attributes);
    for (const configServer of [
      ...Object.entries(config.servers),
      ...Object.entries(config.serverStatus),
      ...Object.entries(config.consoleRelay),
    ]) {
      if (!Object.keys(config.servers).includes(configServer[0])) {
        chalk.redBright(
          `| ${chalk.red("Pterodactyl")}: Server ${chalk.red(`${configServer[1]} (id: ${configServer[0]})`)} was not found in the servers config.`
        );
        continue;
      }
      if (this.servers.find((x) => x.identifier === configServer[0])) continue;
      const server = servers.find(
        (server) => server.identifier === configServer[0]
      );
      if (!server) {
        console.log(
          chalk.redBright(
            `| ${chalk.red("Pterodactyl")}: Server ${chalk.red(`${configServer[1]} (id: ${configServer[0]})`)} was not found in the panel.`
          )
        );
        continue;
      }
      console.log(
        chalk.gray(
          `| ${chalk.red("Pterodactyl")}: Server ${chalk.white(`${configServer[1]} (id: ${configServer[0]})`)} loaded successfully.`
        )
      );
      this.servers.push(server);
    }
    const webhookEnabled = new Collection([
      ...Object.entries(config.serverStatus),
      ...Object.entries(config.consoleRelay),
    ]).filter((_, serverId) =>
      this.servers.find((x) => x.identifier === serverId)
    );
    this.webhookEnabledServers = await Promise.all(
      webhookEnabled.map(async (channelId, serverId) => {
        const webhookLink = await this.client.get<{
          data: {
            token: string;
            socket: string;
          };
        }>(`/servers/${serverId}/websocket`);
        return {
          serverId,
          channelId,
          token: webhookLink.data.data.token,
          url: webhookLink.data.data.socket,
          serverStatusEnabled: !!Object.entries(config.serverStatus).find(
            ([sid]) => serverId === sid
          ),
          consoleRelayEnabled: !!Object.entries(config.consoleRelay).find(
            ([sid]) => serverId === sid
          ),
        };
      })
    );
    console.log(
      chalk.whiteBright(
        `| ${chalk.red("Pterodactyl")}: Loaded ${this.servers.length} pterodactyl servers`
      )
    );
  }
  public async changePower(
    serverId: string,
    signal: "start" | "stop" | "restart" | "kill"
  ) {
    if (!this.servers.find((server) => server.identifier === serverId)) {
      return {
        statusText: "Server not found",
        status: 404,
      };
    }
    const res = await this.client
      .post(`/servers/${serverId}/power`, {
        signal,
      })
      .catch((err) => err);
    return { statusText: res.statusText, status: res.status };
  }
  public async sendCommand(serverId: string, command: string) {
    if (!this.servers.find((server) => server.identifier === serverId))
      return {
        statusText: "Server not found",
        status: 404,
      };
    const res = await this.client
      .post(`/servers/${serverId}/command`, {
        command,
      })
      .catch((err) => err);
    return { statusText: res.statusText, status: res.status };
  }
  public async getUsage(serverId: string) {
    if (!this.servers.find((server) => server.identifier === serverId))
      return 404;
    const res = await this.client.get<ResourcesResult>(
      `/servers/${serverId}/resources`
    );
    const data = res.data.attributes;
    return data;
  }
}
interface Server {
  server_owner: boolean;
  identifier: string;
  uuid: string;
  name: string;
  node: string;
  sftp_details: {
    ip: string;
    port: number;
  };
  description: string;
  limits: {
    memory: number;
    swap: number;
    disk: number;
    io: number;
    cpu: number;
  };
  feature_limits: {
    databases: number;
    allocations: number;
    backups: number;
  };
  is_suspended: boolean;
  is_installing: boolean;
  relationships: {
    allocations: {
      object: string;
      data: {
        object: string;
        attributes: {
          id: number;
          ip: string;
          ip_alias?: any;
          port: number;
          notes?: any;
          is_default: boolean;
        };
      }[];
    };
  };
}
interface ServersResponse {
  object: string;
  data: {
    object: string;
    attributes: Server;
  }[];
  meta: {
    pagination: {
      total: number;
      count: number;
      per_page: number;
      current_page: number;
      total_pages: number;
      links: {};
    };
  };
}
export interface Resources {
  current_state: string;
  is_suspended: boolean;
  resources: {
    memory_bytes: number;
    cpu_absolute: number;
    disk_bytes: number;
    network_rx_bytes: number;
    network_tx_bytes: number;
  };
}

export interface ResourcesResult {
  object: string;
  attributes: Resources;
}
