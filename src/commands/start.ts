import { ApplyOptions } from "@sapphire/decorators";
import { ApplicationCommandRegistry, Command } from "@sapphire/framework";
import { config } from "../config.js";
import { ChatInputCommandInteraction } from "discord.js";
import { api } from "../index.js";
import { checkPermission, createEmbed, getServerName } from "../lib/utils.js";

@ApplyOptions<Command.Options>({
  description: "Start a server",
})
export class StartCommand extends Command {
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
            .setDescription("The server to start")
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
    await interaction.deferReply();
    const status = await api.changePower(server, "start");
    if (status === null)
      return createEmbed("error")
        .setDescription("The server could not be found!")
        .edit(interaction);
    return createEmbed("info")
      .setDescription(`Successfully sent the signal to start the server.`)
      .setAuthor({
        name: getServerName(server),
        url: `${config.pterodactylSettings.url}/server/${server}`,
      })
      .edit(interaction);
  }
}
