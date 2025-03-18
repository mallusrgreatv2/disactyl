import { ApplyOptions } from "@sapphire/decorators";
import { ApplicationCommandRegistry, Command } from "@sapphire/framework";
import { config } from "../config.js";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  ComponentType,
} from "discord.js";
import { api } from "../index.js";
import { checkPermission, createEmbed, getServerName } from "../lib/utils.js";
import { ServerStats } from "../lib/pterodactyl.js";
import { stripIndent } from "common-tags";

@ApplyOptions<Command.Options>({
  description: "Start a live session displaying stats and logs of a server",
})
export class KillCommand extends Command {
  public override registerApplicationCommands(
    registry: ApplicationCommandRegistry,
  ) {
    registry.registerChatInputCommand((command) =>
      command
        .setName(this.name)
        .setDescription(this.description)
        .addStringOption((option) =>
          option
            .setName("server")
            .setDescription("The server to start live session")
            .setChoices(
              config.servers.map((data) => ({
                name: `${data.nickname} (${data.id})`,
                value: data.id,
              })),
            )
            .setRequired(true),
        ),
    );
  }
  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    if (!checkPermission(interaction)) return;
    const server = interaction.options.getString("server", true);
    const session = api.liveSessions.get(server);
    if (session)
      return createEmbed("error").setDescription(
        "A session already exists for this server!",
      );
    await interaction.deferReply();
    let components: ActionRowBuilder<ButtonBuilder>[] = [];
    function liveSessionFunction(data: {
      stats?: ServerStats;
      logs: string[];
    }) {
      const stats = data.stats || api.getUsage(server);
      if (!stats) {
        api.liveSessions.delete(server);
        createEmbed("error")
          .setDescription("Couldn't obtain server stats")
          [
            interaction.replied || interaction.deferred ? "edit" : "reply"
          ](interaction);
        return;
      }
      components = [
        new ActionRowBuilder<ButtonBuilder>({
          components: [
            new ButtonBuilder()
              .setLabel("Start")
              .setDisabled(
                stats.state === "running" ||
                  stats.state === "starting" ||
                  stats.state === "stopping",
              )
              .setStyle(
                stats.state === "running" ||
                  stats.state === "starting" ||
                  stats.state === "stopping"
                  ? ButtonStyle.Secondary
                  : ButtonStyle.Success,
              )
              .setCustomId(`power:start:${server}`),
            new ButtonBuilder()
              .setLabel("Stop")
              .setDisabled(
                stats.state === "offline" || stats.state === "stopping",
              )
              .setStyle(
                stats.state === "offline" || stats.state === "stopping"
                  ? ButtonStyle.Secondary
                  : ButtonStyle.Primary,
              )
              .setCustomId(`power:stop:${server}`),
            new ButtonBuilder()
              .setLabel("Restart")
              .setDisabled(stats.state === "stopping")
              .setStyle(
                stats.state === "stopping"
                  ? ButtonStyle.Secondary
                  : ButtonStyle.Primary,
              )
              .setCustomId(`power:restart:${server}`),
            new ButtonBuilder()
              .setLabel("Kill")
              .setStyle(ButtonStyle.Danger)
              .setCustomId(`power:kill:${server}`),
          ],
        }),
        new ActionRowBuilder<ButtonBuilder>().setComponents(
          new ButtonBuilder()
            .setLabel("End Session")
            .setStyle(ButtonStyle.Danger)
            .setCustomId("end-session"),
        ),
      ];
      return createEmbed("info")
        .setDescription(
          stripIndent`
          Last Updated: <t:${Math.floor(Date.now() / 1000)}:R>
          Server status: **${[...stats.state].map((_, i) => (i === 0 ? _.toUpperCase() : _.toLowerCase())).join("")}**
          \`\`\`ansi\n${data.logs.join("\n") || "No logs yet"}\`\`\``,
        )
        .addFields({
          name: "Resources",
          value: stripIndent`
            **RAM**: ${stats.ram} / ${stats.ram_limit}
            **CPU**: ${stats.cpu}
            **Disk**: ${stats.disk}
            **Network (Inbound)**: ${stats.network_in}
            **Network (Outbound)**: ${stats.network_out}`,
        })
        .setAuthor({
          name: getServerName(server),
          url: `${config.pterodactylSettings.url}/server/${server}`,
        })
        [interaction.replied || interaction.deferred ? "edit" : "reply"](
          interaction,
          {
            components,
          },
        );
    }
    api.liveSessions.set(server, liveSessionFunction);
    (
      await liveSessionFunction({
        logs: [],
      })
    )
      ?.awaitMessageComponent({
        filter: (i) => i.customId === "end-session" && !!checkPermission(i),
        componentType: ComponentType.Button,
        time: 1000 * 60 * 5,
      })
      .then((i) => {
        api.liveSessions.delete(server);
        i.update({
          components: components?.map((row) =>
            row.setComponents(
              row.components.map((x) =>
                x.setDisabled(true).setStyle(ButtonStyle.Secondary),
              ),
            ),
          ),
        });
      })
      .catch(() => {
        api.liveSessions.delete(server);
        interaction.editReply({
          components: components?.map((row) =>
            row.setComponents(
              row.components.map((x) =>
                x.setDisabled(true).setStyle(ButtonStyle.Secondary),
              ),
            ),
          ),
        });
      });
    setTimeout(
      () => {
        api.liveSessions.delete(server);
        interaction.editReply({
          components: components?.map((row) =>
            row.setComponents(
              row.components.map((x) =>
                x.setDisabled(true).setStyle(ButtonStyle.Secondary),
              ),
            ),
          ),
        });
      },
      1000 * 60 * 5,
    );
    return;
  }
}
