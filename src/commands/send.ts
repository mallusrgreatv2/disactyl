import { ApplyOptions } from "@sapphire/decorators";
import { ApplicationCommandRegistry, Command } from "@sapphire/framework";
import { config } from "../config.js";
import { ChatInputCommandInteraction } from "discord.js";
import { api } from "../index.js";
import { checkPermission } from "../lib/utils.js";

@ApplyOptions<Command.Options>({
  description: "Send a command to a server",
})
export class RestartCommand extends Command {
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
            .setDescription("The server to restart")
            .setChoices(
              Object.entries(config.servers).map(([key, value]) => ({
                name: `${value} (${key})`,
                value: key,
              }))
            )
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("command")
            .setDescription("The command to send to the server")
            .setRequired(true)
        )
    );
  }
  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    if (!checkPermission(interaction)) return;
    const server = interaction.options.getString("server", true);
    const command = interaction.options.getString("command", true);
    await interaction.deferReply();
    const data = await api.sendCommand(server, command);
    if (data.status === 502)
      return interaction.editReply(
        "The server is offline! Start it to send commands."
      );
    return interaction.editReply("Successfully restarted the server.");
  }
}
