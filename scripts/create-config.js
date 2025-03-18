import { green, red, yellow } from "colorette";
import fs from "fs";
import rl from "readline/promises";
import { stdin, stdout } from "process";
if (!fs.existsSync("src/config.ts")) {
  createConfig();
} else {
  (async () => {
    const i = rl.createInterface(stdin, stdout);
    let str = (
      await i.question(
        red(
          "The config already exists! Do you want to reset the config? [y/N] ",
        ),
      )
    ).toLowerCase();
    while (str && str !== "y" && str !== "n") {
      str = (await i.question(red("Pick a valid option! [y/N]"))).toLowerCase();
    }
    if (str === "y") createConfig();
    else console.log(`Cancelled!`);
    i.close();
  })();
}
function createConfig() {
  const text = fs
    .readFileSync("src/config_default.ts")
    .toString()
    .split("\n")
    .slice(5)
    .join("\n")
    .replace(/export interface Config \{[\s\S]*?\n\}/, "")
    .split("\n");
  text.unshift(`import { Config } from "./config_default.js";`, "");
  text.pop();
  fs.writeFileSync("src/config.ts", text.join("\n"));
  console.log(
    `${green("Created config!")} Open ${yellow("src/config.ts")} and configure the options.\nThen you can start the bot using ${yellow("npm run start")}.`,
  );
}
