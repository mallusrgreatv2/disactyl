import { ApplyOptions } from "@sapphire/decorators";
import { Listener } from "@sapphire/framework";
import chalk from "chalk";
import { api } from "../index.js";

@ApplyOptions<Listener.Options>({ once: true })
export class UserEvent extends Listener {
  public override async run() {
    await api.init();
    console.log(
      chalk.whiteBright(
        `| ${chalk.blue("Discord")}: Bot started as user ${this.container.client.user!.tag}`,
      ),
    );
  }
}
