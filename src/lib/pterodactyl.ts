import axios, { AxiosInstance, AxiosError } from "axios";
import { config } from "../config.js";
import WebSocket from "ws";
import { createEmbed, formatBytes, getServerName } from "./utils.js";
import { SapphireClient } from "@sapphire/framework";
import { Colors, SendableChannels } from "discord.js";
import stripAnsi from "strip-ansi";
import { logger } from "../index.js";
import { gray } from "colorette";

export class Pterodactyl {
  public axiosClient: AxiosInstance;
  public url: string;
  public apiKey: string;
  public servers: PterodactylServer[] = [];
  public liveSessions: Map<string, LiveSessionFunction> = new Map();

  constructor(
    public client: SapphireClient,
    url?: string,
    apiKey?: string,
  ) {
    this.url = url || config.pterodactylSettings.url;
    this.apiKey = apiKey || config.pterodactylSettings.apiKey;
    this.axiosClient = axios.create({
      baseURL: `${this.url}/api/client`,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
  }

  public async init() {
    logger.info("Pterodactyl", gray(`Loading servers...`));

    for (const server of config.servers) {
      const wsData = await this.getWebsocketData(server.id);
      const ws = new WebSocket(wsData.url, { origin: this.url });
      let connected = false;
      const consoleRelay = this.getSendableChannel(
        server.consoleRelayChannelId,
      );
      const serverStatus = this.getSendableChannel(
        server.serverStatusChannelId,
      );

      ws.on("open", () =>
        ws.send(JSON.stringify({ event: "auth", args: [wsData.token] })),
      );
      const logs = [] as string[];
      const pushLog = (data: string) => {
        if (logs.length >= 10) logs.shift();
        logs.push(data);
      };
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      ws.on("message", async (rawMessage) => {
        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        const data = JSON.parse(rawMessage.toString()) as {
          event: string;
          args: string[];
        };
        const srv = this.servers.find((x) => x.id === server.id);

        switch (data.event) {
          case "token expiring":
          case "token expired": {
            logger.debug(
              "Pterodactyl",
              gray(`Reconnecting to server ${getServerName(server.id)}`),
            );
            const wsData = await this.getWebsocketData(server.id);
            ws.send(JSON.stringify({ event: "auth", args: [wsData.token] }));
            break;
          }
          case "auth success":
            if (!connected) {
              ws.send(JSON.stringify({ event: "send stats", args: [null] }));
              logger.info(
                "Pterodactyl",
                `Connected to the server ${getServerName(server.id)}`,
              );
            } else {
              logger.info(
                "Pterodactyl",
                gray(
                  `Successfully reconnected to the server ${getServerName(server.id)}.`,
                ),
              );
            }

            connected = true;
            break;
          case "console output": {
            pushLog(data.args[0]);
            this.liveSessions.get(server.id)?.({
              logs,
            });
            if (consoleRelay) {
              logger.debug(
                "Pterodactyl",
                `Received console output from server ${getServerName(server.id)}`,
              );
              void consoleRelay.send(
                `**${getServerName(server.id)}**: ${stripAnsi(data.args[0])}`,
              );
            }
            break;
          }
          case "status":
            {
              if (!serverStatus || !srv) break;
              srv.stats.state = data.args[0] as ServerStatus;
              await createEmbed("info")
                .setDescription(
                  `Server **${getServerName(server.id)}** is now **${data.args[0]}**.`,
                )
                .setColor(this.statusColor(srv.stats.state))
                .send(serverStatus);
              logger.debug(
                "Pterodactyl",
                `Server ${getServerName(server.id)} changed status to: ${data.args[0]}`,
              );
            }
            break;
          case "stats": {
            const parsed = JSON.parse(data.args[0]) as {
              state: string;
              network: {
                rx_bytes: number;
                tx_bytes: number;
              };
              cpu_absolute: number;
              memory_bytes: number;
              memory_limit_bytes: number;
              disk_bytes: number;
            };
            if (!("network" in parsed)) return;

            const existingServer = this.servers.find((x) => x.id === server.id);
            const stats = {
              state: parsed.state as ServerStatus,
              network_in: formatBytes(parsed.network.rx_bytes),
              network_out: formatBytes(parsed.network.tx_bytes),
              cpu: `${parsed.cpu_absolute.toFixed(2)}%`,
              ram: formatBytes(parsed.memory_bytes),
              ram_limit: formatBytes(parsed.memory_limit_bytes),
              disk: formatBytes(parsed.disk_bytes),
              lastUpdated: Date.now(),
            } satisfies ServerStats;
            this.liveSessions.get(server.id)?.({
              logs,
              stats,
            });
            if (existingServer) {
              existingServer.stats = stats;
            } else {
              this.servers.push({
                ...server,
                ws,
                stats,
              });
            }
            logger.debug(
              "Pterodactyl",
              `Received stats for server ${getServerName(server.id)}`,
            );
            break;
          }
        }
      });
    }
  }

  private getSendableChannel(channelId?: string): SendableChannels | null {
    if (!channelId) return null;
    const channel = this.client.channels.cache.get(channelId);
    if (!channel?.isSendable())
      throw new Error(`Channel ID ${channelId} is not a valid text channel.`);
    return channel;
  }

  public changePower(
    serverId: string,
    signal: "start" | "stop" | "restart" | "kill",
  ) {
    const server = this.servers.find((s) => s.id === serverId);
    if (!server) return null;
    server.ws.send(JSON.stringify({ event: "set state", args: [signal] }));
    return true;
  }

  public sendCommand(serverId: string, command: string) {
    const server = this.servers.find((s) => s.id === serverId);
    if (!server) return null;
    server.ws.send(JSON.stringify({ event: "send command", args: [command] }));
    return true;
  }

  public getUsage(serverId: string) {
    const server = this.servers.find((s) => s.id === serverId);
    if (!server) return null;

    return server ? server.stats : null;
  }

  private async getWebsocketData(serverId: string) {
    try {
      const { data } = await this.axiosClient.get<{
        data: {
          token: string;
          socket: string;
        };
      }>(`/servers/${serverId}/websocket`);
      return { token: data.data.token, url: data.data.socket };
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 404) {
        throw new Error(`Server ${serverId} was not found in the panel.`);
      }
      throw error;
    }
  }
  private statusColor(status: ServerStatus) {
    switch (status) {
      case "offline":
        return Colors.DarkRed;
      case "stopping":
        return Colors.Red;
      case "running":
        return Colors.Green;
      case "starting":
        return Colors.DarkAqua;
    }
  }
}
export type LiveSessionFunction = (options: {
  logs: string[];
  stats?: ServerStats;
}) => unknown;
export interface ServerStats {
  state: ServerStatus;
  ram: string;
  ram_limit: string;
  disk: string;
  cpu: string;
  network_in: string;
  network_out: string;
  lastUpdated: number;
}

type ServerStatus = "offline" | "running" | "starting" | "stopping";

export interface PterodactylServer {
  id: string;
  nickname?: string;
  ws: WebSocket;
  serverStatusChannelId?: string;
  consoleRelayChannelId?: string;
  stats: ServerStats;
}
