export const config = {
  /** The Discord bot's token */
  token: "",
  /** The ID of the role in which all members should have access to use the commands */
  accessRoleId: "",
  pterodactylSettings: {
    /** URL of the panel, have only http(s):// and then the domain, nothing else. Don't leave trailing slash (/). */
    url: "https://panel.example.com",
    /** Get it from Account Settings -> API Credentials */
    apiKey: "",
  },
  /** Nicknames for servers so they are easier to use */
  servers: {
    // format => "serverId": "nickname"
    123456: "Proxy",
  },
  /** Send messages when servers start or stop to this channel.
   * When mentioning the server name, the bot will use
   */
  serverStatus: {
    // format => "123456": "channel id"
    "123456": "channelId",
  },
  /** Relay messages from console to the channel */
  consoleRelay: {
    // format => "123456": "channel id"
    "123456": "channelId",
  },
  commandSettings: {
    info: {
      /** Whether you want to lock the info command to those who have the access role. */
      lockWithRole: true,
    },
  },
} as Config;
interface Config {
  token: string;
  accessRoleId?: string;
  pterodactylSettings: {
    url: string;
    apiKey: string;
  };
  servers: Record<string, string>;
  serverStatus: Record<string, string>;
  consoleRelay: Record<string, string>;
  commandSettings: {
    info: {
      lockWithRole: boolean;
    };
  };
}
