import { ApplyOptions } from "@sapphire/decorators";
import {
  InteractionHandler,
  InteractionHandlerTypes,
} from "@sapphire/framework";
import {
  ActionRowBuilder,
  ButtonInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { checkPermission } from "../lib/utils.js";

@ApplyOptions<InteractionHandler.Options>({
  interactionHandlerType: InteractionHandlerTypes.Button,
})
export class SendCommandHandler extends InteractionHandler {
  override parse(interaction: ButtonInteraction) {
    if (interaction.customId.startsWith("send-command")) {
      const options = interaction.customId.split(":");
      options.shift();
      return this.some(options);
    }
    return this.none();
  }
  override async run(interaction: ButtonInteraction, parsedData: string[]) {
    if (!checkPermission(interaction)) return;
    const modal = new ModalBuilder()
      .setTitle("Send Command")
      .setComponents(
        new ActionRowBuilder<TextInputBuilder>().setComponents(
          new TextInputBuilder()
            .setLabel("Command")
            .setPlaceholder("say Hello")
            .setStyle(TextInputStyle.Short)
            .setCustomId("command")
            .setRequired(true),
        ),
      )
      .setCustomId(`send-command-modal:${parsedData[0]}`);
    await interaction.showModal(modal);
  }
}
