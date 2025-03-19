import { ApplyOptions } from "@sapphire/decorators";
import { ApplicationCommandRegistry, Command } from "@sapphire/framework";
import { config } from "../config.js";
import { ChatInputCommandInteraction } from "discord.js";
import { api } from "../index.js";
import { checkPermission, createEmbed } from "../lib/utils.js";
import { stripIndent } from "common-tags";

@ApplyOptions<Command.Options>({
  description: "View information (resources and status) of a server",
})
export class StopCommand extends Command {
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
            .setDescription("The server to view information of")
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
    if (
      config.commandSettings.info.lockWithRole &&
      !checkPermission(interaction)
    )
      return;
    const server = interaction.options.getString("server", true);
    await interaction.deferReply();
    const data = api.getUsage(server);
    if (data === null) {
      return createEmbed("error")
        .setDescription("Server not found!")
        .reply(interaction);
    }
    const embed = createEmbed("info")
      .setDescription(
        `
      Status: ${data.state
        .split(" ")
        .map((word) =>
          [...word]
            .map((x, i) => (i === 0 ? x.toUpperCase() : x.toLowerCase()))
            .join(""),
        )
        .join(" ")}`,
      )
      .addFields({
        name: "Resources",
        value: stripIndent`
    **RAM**: ${data.ram} / ${data.ram_limit}
    **CPU**: ${data.cpu}
    **Disk**: ${data.disk}
    **Network (Inbound)**: ${data.network_in}
    **Network (Outbound)**: ${data.network_out}
    
    *Stats last updated:* <t:${Math.floor(data.lastUpdated / 1000)}:R>`,
      })
      .setColor("Aqua")
      .setTimestamp(data.lastUpdated);
    return embed.edit(interaction);
  }
}
