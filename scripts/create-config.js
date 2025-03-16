import chalk from "chalk";
import fs from "fs";
if (!fs.existsSync("src/config.ts")) {
  fs.writeFileSync(
    "src/config.ts",
    fs
      .readFileSync("src/config_default.ts")
      .toString()
      .split("\n")
      .slice(5)
      .join("\n")
  );
  console.log(
    `${chalk.green("Created config!")} Open ${chalk.yellow("src/config.ts")} and configure the options.\nThen you can start the bot using ${chalk.yellow("npm run start")}.`
  );
} else {
  console.log();
}
