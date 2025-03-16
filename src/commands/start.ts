import { ApplyOptions } from "@sapphire/decorators";
import { ApplicationCommandRegistry, Command } from "@sapphire/framework";
import { config } from "../config.js";
import { ChatInputCommandInteraction } from "discord.js";
import { api } from "../index.js";
import { checkPermission } from "../lib/utils.js";

@ApplyOptions<Command.Options>({
  description: "Start a server",
})
export class StartCommand extends Command {
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
            .setDescription("The server to start")
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
    if (!checkPermission(interaction)) return;
    const server = interaction.options.getString("server", true);
    await interaction.deferReply();
    await api.changePower(server, "start");
    return interaction.editReply("Successfully started the server.");
  }
}
