import { blueBright, cyanBright, magentaBright, redBright } from "colorette";
import { Actor } from "./Logger.js";
import { LoggerStyle, type LoggerStyleResolvable } from "./LoggerStyle.js";
import {
  LoggerTimestamp,
  type LoggerTimestampOptions,
} from "./LoggerTimestamp.js";

/**
 * Logger utility that stores and applies a full style into the message.
 * @since 1.0.0
 */
export class LoggerLevel {
  /**
   * The timestamp formatter.
   * @since 1.0.0
   */
  public timestamp: LoggerTimestamp | null;

  /**
   * The infix, added between the timestamp and the message.
   * @since 1.0.0
   */
  public infix: string;

  /**
   * The style formatter for the message.
   * @since 1.0.0
   */
  public message: LoggerStyle | null;

  public constructor(options: LoggerLevelOptions = {}) {
    this.timestamp =
      options.timestamp === null
        ? null
        : new LoggerTimestamp(options.timestamp);
    this.infix = options.infix ?? "";
    this.message =
      options.message === null ? null : new LoggerStyle(options.message);
  }

  public run(actor: Actor, content: string) {
    const prefix =
      (this.timestamp?.run() ?? "") +
      this.infix +
      `${this.actorColor(actor.padEnd(11, " "))} | `;

    if (prefix.length) {
      const formatter = this.message
        ? (line: string) => prefix + this.message!.run(line)
        : (line: string) => prefix + line;
      return content.split("\n").map(formatter).join("\n");
    }

    return this.message ? this.message.run(content) : content;
  }
  private actorColor(actor: string) {
    switch (actor.trim()) {
      case "Discord":
        return blueBright(actor);
      case "Pterodactyl":
        return redBright(actor);
      case "Shard":
        return cyanBright(actor);
      case "Script":
        return magentaBright(actor);
      default:
        return actor;
    }
  }
}

/**
 * The options for {@link LoggerLevel}.
 * @since 1.0.0
 */
export interface LoggerLevelOptions {
  /**
   * The timestamp options. Set to `null` to disable timestamp parsing.
   * @since 1.0.0
   * @default {}
   */
  timestamp?: LoggerTimestampOptions | null;

  /**
   * The infix to be included between the timestamp and the message.
   * @since 1.0.0
   * @default ''
   */
  infix?: string;

  /**
   * The style options for the message.
   * @since 1.0.0
   * @default colorette.clear
   */
  message?: LoggerStyleResolvable | null;
}
