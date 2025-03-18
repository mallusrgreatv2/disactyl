import "./Logger.js";

import {
  LogLevel,
  Plugin,
  preGenericsInitialization,
  SapphireClient,
} from "@sapphire/framework";
import type { ClientOptions } from "discord.js";
import { Actor, Logger, LoggerOptions } from "./Logger.js";

/**
 * @since 1.0.0
 */
export class LoggerPlugin extends Plugin {
  /**
   * @since 1.0.0
   */
  public static override [preGenericsInitialization](
    this: SapphireClient,
    options: ClientOptions,
  ): void {
    options.logger ??= {};
    options.logger.instance = new Logger(options.logger);
  }
}

SapphireClient.plugins.registerPreGenericsInitializationHook(
  LoggerPlugin[preGenericsInitialization],
  "Logger-PreGenericsInitialization",
);
declare module "@sapphire/framework" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface ClientLoggerOptions extends LoggerOptions {}
  export interface ILogger {
    /**
     * Alias of {@link ILogger.write} with {@link LogLevel.Trace} as level.
     * @param actor The actor
     * @param values The values to log.
     */
    trace(actor: Actor, ...values: readonly unknown[]): void;
    /**
     * Alias of {@link ILogger.write} with {@link LogLevel.Debug} as level.
     * @param actor The actor
     * @param values The values to log.
     */
    debug(actor: Actor, ...values: readonly unknown[]): void;
    /**
     * Alias of {@link ILogger.write} with {@link LogLevel.Info} as level.
     * @param actor The actor
     * @param values The values to log.
     */
    info(actor: Actor, ...values: readonly unknown[]): void;
    /**
     * Alias of {@link ILogger.write} with {@link LogLevel.Warn} as level.
     * @param actor The actor
     * @param values The values to log.
     */
    warn(actor: Actor, ...values: readonly unknown[]): void;
    /**
     * Alias of {@link ILogger.write} with {@link LogLevel.Error} as level.
     * @param actor The actor
     * @param values The values to log.
     */
    error(actor: Actor, ...values: readonly unknown[]): void;
    /**
     * Alias of {@link ILogger.write} with {@link LogLevel.Fatal} as level.
     * @param actor The actor
     * @param values The values to log.
     */
    fatal(actor: Actor, ...values: readonly unknown[]): void;
    /**
     * Writes the log message given a level and the value(s).
     * @param level The log level.
     * @param actor The actor
     * @param values The values to log.
     */
    write(level: LogLevel, actor: Actor, ...values: readonly unknown[]): void;
  }
}
