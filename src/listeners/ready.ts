import { ApplyOptions } from "@sapphire/decorators";
import { Listener } from "@sapphire/framework";
import { api } from "../index.js";

@ApplyOptions<Listener.Options>({ once: true })
export class UserEvent extends Listener {
  public override async run() {
    await api.init();
    this.container.logger.info(
      "Discord",
      `Bot logged in as user ${this.container.client.user!.tag}`,
    );
  }
}
