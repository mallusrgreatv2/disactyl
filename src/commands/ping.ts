import { ApplyOptions } from "@sapphire/decorators";
import { Command } from "@sapphire/framework";

@ApplyOptions<Command.Options>({
  description: "ping pong",
})
export class UserCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand({
      name: this.name,
      description: this.description,
    });
  }

  public override async chatInputRun(
    interaction: Command.ChatInputCommandInteraction
  ) {
    return interaction.reply(
      `🏓 Pong! **${this.container.client.ws.ping.toFixed()}ms**`
    );
  }
}
