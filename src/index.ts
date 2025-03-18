import "./lib/logger/register.js";
import { Pterodactyl } from "./lib/pterodactyl.js";
import { LogLevel, SapphireClient } from "@sapphire/framework";
import { GatewayIntentBits } from "discord.js";
import { config } from "./config.js";
import { gray } from "colorette";

const client = new SapphireClient({
  intents: [GatewayIntentBits.Guilds],
  logger: {
    level:
      process.env.NODE_ENV === "development" ? LogLevel.Debug : LogLevel.Info,
  },
});
export const logger = client.logger;
export const api = new Pterodactyl(client);
const main = async () => {
  logger.info("Discord", gray(`Logging in...`));
  try {
    await client.login(config.token);
  } catch (error) {
    logger.error("Discord", "Error occured while logging in.");
    console.error(error);
    await client.destroy();
    process.exit(1);
  }
};
void main();
