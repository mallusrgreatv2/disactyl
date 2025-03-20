import { ApplyOptions } from "@sapphire/decorators";
import {
  InteractionHandler,
  InteractionHandlerTypes,
} from "@sapphire/framework";
import {
  ButtonInteraction,
  MessageFlags,
  ModalSubmitInteraction,
} from "discord.js";
import { checkPermission, createEmbed, getServerName } from "../lib/utils.js";
import { api } from "../index.js";
import { config } from "../config.js";
import { Assets } from "../lib/assets.js";

@ApplyOptions<InteractionHandler.Options>({
  interactionHandlerType: InteractionHandlerTypes.ModalSubmit,
})
export class SendCommandHandler extends InteractionHandler {
  override parse(interaction: ButtonInteraction) {
    if (interaction.customId.startsWith("send-command-modal")) {
      const options = interaction.customId.split(":");
      options.shift();
      return this.some(options);
    }
    return this.none();
  }
  override async run(
    interaction: ModalSubmitInteraction,
    parsedData: string[],
  ) {
    if (!checkPermission(interaction)) return;
    const serverId = parsedData[0];
    const command = interaction.fields.getTextInputValue("command");
    const success = api.sendCommand(serverId, command);
    if (!success)
      return createEmbed("error")
        .setDescription("Could not find the server")
        .reply(interaction);
    return createEmbed("info")
      .setDescription("Sent signal to send command to the server.")
      .setAuthor({
        name: getServerName(serverId),
        url: `${config.pterodactylSettings.url}/server/${serverId}`,
        iconURL: Assets.Success,
      })
      .reply(interaction, {
        flags: [MessageFlags.Ephemeral],
      });
  }
}
