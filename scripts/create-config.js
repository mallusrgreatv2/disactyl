import chalk from "chalk";
import fs from "fs";
import rl from "readline/promises";
if (!fs.existsSync("src/config.ts")) {
  createConfig();
} else {
  const i = rl.createInterface(process.stdin, process.stdout);
  let str = (
    await i.question(
      chalk.red(
        "The config already exists! Do you want to reset the config? [y/N] "
      )
    )
  ).toLowerCase();
  while (str && str !== "y" && str !== "n") {
    str = (
      await i.question(chalk.red("Pick a valid option! [y/N]"))
    ).toLowerCase();
  }
  if (str === "y") createConfig();
  else console.log(`Cancelled!`);
  i.close();
}
function createConfig() {
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
}
