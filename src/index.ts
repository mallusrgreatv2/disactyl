import fs from "fs";
import { Pterodactyl } from "./lib/pterodactyl.js";
export const api = new Pterodactyl();
if (!fs.existsSync("src/config.ts")) {
  fs.writeFileSync("src/config.ts", fs.readFileSync("src/config_default.ts"));
  console.log("Created config! Open src/config.ts and configure the options.");
  process.exit(0);
}

import { SapphireClient } from "@sapphire/framework";
import { GatewayIntentBits } from "discord.js";
import chalk from "chalk";
import { config } from "./config.js";

const client = new SapphireClient({
  intents: [GatewayIntentBits.Guilds],
});
const main = async () => {
  console.log(chalk.gray(`| ${chalk.blue("Discord")}: Logging in...`));
  try {
    await client.login(config.token);
  } catch (error) {
    console.log(
      chalk.redBright(
        `| ${chalk.blue("Discord")}: Error occured while logging in.`
      )
    );
    console.error(error);
    await client.destroy();
    process.exit(1);
  }
};

void main();
