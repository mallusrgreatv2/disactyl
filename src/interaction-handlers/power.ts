import { ApplyOptions } from "@sapphire/decorators";
import {
  InteractionHandler,
  InteractionHandlerTypes,
} from "@sapphire/framework";
import { ButtonInteraction, MessageFlags } from "discord.js";
import { checkPermission, createEmbed, getServerName } from "../lib/utils.js";
import { api } from "../index.js";
import { config } from "../config.js";
import { Assets } from "../lib/assets.js";

@ApplyOptions<InteractionHandler.Options>({
  interactionHandlerType: InteractionHandlerTypes.Button,
})
export class PowerHandler extends InteractionHandler {
  override parse(interaction: ButtonInteraction) {
    if (interaction.customId.startsWith("power")) {
      const options = interaction.customId.split(":");
      options.shift();
      return this.some(options);
    }
    return this.none();
  }
  override async run(interaction: ButtonInteraction, parsedData: string[]) {
    if (!checkPermission(interaction)) return;
    const server = parsedData[1];
    const status = api.changePower(
      server,
      parsedData[0] as "start" | "stop" | "restart" | "kill",
    );
    if (status === null)
      return createEmbed("error")
        .setDescription("The server could not be found!")
        .edit(interaction);
    return createEmbed("success")
      .setDescription(
        `Successfully sent the signal to ${parsedData[0]} the server.`,
      )
      .setAuthor({
        name: getServerName(server),
        url: `${config.pterodactylSettings.url}/server/${server}`,
        iconURL: Assets.Success,
      })
      .reply(interaction, {
        flags: [MessageFlags.Ephemeral],
      });
  }
}
