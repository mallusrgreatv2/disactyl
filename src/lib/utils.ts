import {
  container,
  type ChatInputCommandSuccessPayload,
  type Command,
  type ContextMenuCommandSuccessPayload,
  type MessageCommandSuccessPayload,
} from "@sapphire/framework";
import {
  ButtonInteraction,
  CommandInteraction,
  EmbedBuilder,
  InteractionEditReplyOptions,
  InteractionReplyOptions,
  Message,
  MessageComponentInteraction,
  MessageCreateOptions,
  MessageEditOptions,
  MessageReplyOptions,
  PermissionFlagsBits,
  SendableChannels,
  type APIUser,
  type ChatInputCommandInteraction,
  type Guild,
  type User,
} from "discord.js";
import { config } from "../config.js";
import { api } from "../index.js";
import { cyan } from "colorette";

export function logSuccessCommand(
  payload:
    | ContextMenuCommandSuccessPayload
    | ChatInputCommandSuccessPayload
    | MessageCommandSuccessPayload,
): void {
  let successLoggerData: ReturnType<typeof getSuccessLoggerData>;

  if ("interaction" in payload) {
    successLoggerData = getSuccessLoggerData(
      payload.interaction.guild,
      payload.interaction.user,
      payload.command,
    );
  } else {
    successLoggerData = getSuccessLoggerData(
      payload.message.guild,
      payload.message.author,
      payload.command,
    );
  }

  container.logger.debug(
    "Shard",
    `${successLoggerData.shard} - ${successLoggerData.commandName} ${successLoggerData.author} ${successLoggerData.sentAt}`,
  );
}

export function getSuccessLoggerData(
  guild: Guild | null,
  user: User,
  command: Command,
) {
  const shard = getShardInfo(guild?.shardId ?? 0);
  const commandName = getCommandInfo(command);
  const author = getAuthorInfo(user);
  const sentAt = getGuildInfo(guild);

  return { shard, commandName, author, sentAt };
}

function getShardInfo(id: number) {
  return `[${cyan(id.toString())}]`;
}

function getCommandInfo(command: Command) {
  return cyan(command.name);
}

function getAuthorInfo(author: User | APIUser) {
  return `${author.username}[${cyan(author.id)}]`;
}

function getGuildInfo(guild: Guild | null) {
  if (guild === null) return "Direct Messages";
  return `${guild.name}[${cyan(guild.id)}]`;
}
export function checkPermission(
  interaction: ChatInputCommandInteraction | ButtonInteraction,
) {
  if (!interaction.inCachedGuild()) return;
  if (interaction.memberPermissions?.has(PermissionFlagsBits.Administrator))
    return true;
  if (
    config.accessRoleId &&
    interaction.member.roles.cache.has(config.accessRoleId)
  )
    return true;
  if (interaction.replied || interaction.deferred)
    interaction.editReply({
      content: ":x: You do not have permission to use this command.",
    });
  else
    interaction.reply({
      content: ":x: You do not have permission to use this command.",
    });
  return false;
}
class EmbedBuilderX extends EmbedBuilder {
  reply(
    interaction: CommandInteraction | MessageComponentInteraction,
    options?: InteractionReplyOptions,
  ) {
    return interaction.reply({
      ...options,
      embeds: [...(options?.embeds ?? []), this],
    });
  }
  edit(
    interaction: CommandInteraction | MessageComponentInteraction,
    options?: InteractionEditReplyOptions,
  ) {
    return interaction.editReply({
      ...options,
      embeds: [...(options?.embeds ?? []), this],
    });
  }
  send(channel: SendableChannels, options?: MessageCreateOptions) {
    return channel.send({
      ...options,
      embeds: [...(options?.embeds ?? []), this],
    });
  }
  replyMessage(message: Message, options?: MessageReplyOptions) {
    return message.reply({
      ...options,
      embeds: [...(options?.embeds ?? []), this],
    });
  }
  editMessage(message: Message, options?: MessageEditOptions) {
    return message.edit({
      ...options,
      embeds: [...(options?.embeds ?? []), this],
    });
  }
}
export function createEmbed(preset: "error" | "info") {
  switch (preset) {
    case "error":
      return new EmbedBuilderX()
        .setAuthor({ name: "Error", iconURL: "" })
        .setColor("DarkRed");
    case "info":
      return new EmbedBuilderX().setColor("Aqua");
  }
}
export function getServerName(serverId: string, hideServerId?: boolean) {
  const server =
    api.servers.find((x) => x.id === serverId) ||
    config.servers.find((s) => s.id === serverId);
  if (!server) return serverId;
  const name = server.nickname || serverId;
  return `${name}${hideServerId || name === serverId ? "" : ` (${serverId})`}`;
}
export function formatBytes(bytes: number): string {
  if (bytes < 0) {
    throw new Error("Byte value cannot be negative");
  }

  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (bytes === 0) return "0 Bytes";

  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);

  return `${value.toFixed(2)} ${sizes[i]}`;
}
