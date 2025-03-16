import { ApplyOptions } from "@sapphire/decorators";
import { ApplicationCommandRegistry, Command } from "@sapphire/framework";
import { config } from "../config.js";
import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { api } from "../index.js";
import { checkPermission } from "../lib/utils.js";
import { stripIndent } from "common-tags";

@ApplyOptions<Command.Options>({
  description: "View information (resources and status) of a server",
})
export class StopCommand extends Command {
  public override registerApplicationCommands(
    registry: ApplicationCommandRegistry
  ) {
    registry.registerChatInputCommand((command) =>
      command
        .setName(this.name)
        .setDescription(this.description)
        .addStringOption((option) =>
          option
            .setName("server")
            .setDescription("The server to view information of")
            .setChoices(
              Object.entries(config.servers).map(([key, value]) => ({
                name: `${value} (${key})`,
                value: key,
              }))
            )
            .setRequired(true)
        )
    );
  }
  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    if (
      config.commandSettings.info.lockWithRole &&
      !checkPermission(interaction)
    )
      return;
    const server = interaction.options.getString("server", true);
    await interaction.deferReply();
    const data = await api.getUsage(server);
    if (data === 404) return interaction.editReply("Couldn't find the server!");
    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setDescription(
            data.is_suspended
              ? "**Suspended**"
              : `
            Status: ${data.current_state
              .split(" ")
              .map((word) =>
                [...word]
                  .map((x, i) => (i === 0 ? x.toUpperCase() : x.toLowerCase()))
                  .join("")
              )
              .join(" ")}`
          )
          .addFields({
            name: "Resources",
            value: stripIndent`
          RAM: ${formatBytes(data.resources.memory_bytes)}
          CPU: ${data.resources.cpu_absolute}%
          Disk: ${formatBytes(data.resources.disk_bytes)}
          Network (Inbound): ${formatBytes(data.resources.network_rx_bytes)}
          Network (Outbound): ${formatBytes(data.resources.network_tx_bytes)}`,
          }),
      ],
    });
  }
}
function formatBytes(bytes: number): string {
  if (bytes < 0) {
    throw new Error("Byte value cannot be negative");
  }

  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (bytes === 0) return "0 Bytes";

  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);

  return `${value.toFixed(2)} ${sizes[i]}`;
}
