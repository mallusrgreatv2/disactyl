import { ApplyOptions } from "@sapphire/decorators";
import { Listener } from "@sapphire/framework";
import { api } from "../index.js";
import { WebSocket } from "ws";
import { config } from "../config.js";
import stripAnsi from "strip-ansi";
import chalk from "chalk";

@ApplyOptions<Listener.Options>({ once: true })
export class UserEvent extends Listener {
  public override run() {
    this.startWebhooks();
    console.log(
      chalk.whiteBright(
        `| ${chalk.blue("Discord")}: Bot started as user ${this.container.client.user!.tag}`
      )
    );
  }

  private async startWebhooks() {
    const servers = api.webhookEnabledServers;
    console.log(
      chalk.gray(`| ${chalk.red("Pterodactyl")}: Loading websockets...`)
    );
    let i = 0;
    for (const server of servers) {
      const serverData = api.servers.find(
        (x) => x.identifier === server.serverId
      );
      if (!serverData) {
        console.log(
          `| ${chalk.red("Pterodactyl")}: Server ${server.serverId} was not found in servers config. Aborted starting websocket.`
        );
        continue;
      }
      const ws = new WebSocket(server.url, {
        origin: config.pterodactylSettings.url,
      });
      const channel = this.container.client.channels.cache.get(
        server.channelId
      );
      const serverName =
        Object.entries(config.servers).find(
          (x) => x[0] === server.serverId
        )?.[1] || serverData;
      ws.on("open", () => {
        ws.send(
          JSON.stringify({
            event: "auth",
            args: [server.token],
          })
        );
      });
      ws.on("message", async (data) => {
        const d = JSON.parse(data.toString()) as {
          event: string;
          args: string[];
        };

        if (!channel?.isSendable()) return;
        switch (d.event) {
          case "token expiring":
          case "token expired": {
            const newData = await api.client.get<{
              data: {
                token: string;
                socket: string;
              };
            }>(`/servers/${server.serverId}/websocket`);
            ws.send(
              JSON.stringify({
                event: "auth",
                args: [newData.data.data.token],
              })
            );
            break;
          }
          case "status": {
            if (
              server.serverStatusEnabled &&
              !["starting", "stopping"].includes(d.args[0])
            )
              channel.send(`Server **${serverName}** is now **${d.args[0]}**.`);
            break;
          }
          case "console output": {
            if (server.consoleRelayEnabled)
              channel.send(
                `**${serverName}**: ${stripAnsi(d.args.join("\n"))}`
              );
            break;
          }
          default: {
            if (["auth success", "stats"].includes(d.event)) break;
            console.log(d.event, d.args);
          }
        }
      });
      console.log(
        chalk.gray(
          `| ${chalk.red("Pterodactyl")}: Loaded websocket for server ${chalk.white(`${serverName} (id: ${server.serverId})`)} with ${new Intl.ListFormat().format([server.serverStatusEnabled ? "server status logging" : null, server.consoleRelayEnabled ? "console relay" : null].filter((x) => x) as string[])}`
        )
      );
      i++;
    }
    if (i)
      console.log(
        chalk.whiteBright(
          `| ${chalk.red("Pterodactyl")}: Loaded ${i} websockets.`
        )
      );
  }
}
