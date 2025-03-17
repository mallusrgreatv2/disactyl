// Don't edit this file! This is the DEFAULT config.
// A new file src/config.ts will be created when you run the script for the first time.
// In case something goes wrong with your config, you can copy paste from here.
// Editing this config has no effect.

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
  servers: [
    {
      // a1b2c3d4 is an example of the ID of a server.
      // For example, if the link to the server in Pterodactyl is:
      // https://panel.pterodactyl.dev/server/a1b2c3d4
      // then the ID is a1b2c3d4
      id: "a1b2c3d4",
      // (Optional) The nickname to use for your convenience.
      nickname: "Proxy Server",
      /**
       * (Optional) Server Status: Send messages when servers start or stop to this channel.
       * (Optional) Console Relay: Relay messages from server console to this channel.
       * Leave empty or use null or undefined to disable.
       */
      serverStatusChannelId: "",
      consoleRelayChannelId: "",
    },
  ],
  commandSettings: {
    info: {
      /** Whether you want to lock the info command to those who have the access role. */
      lockWithRole: true,
    },
  },
} as Config;
export interface Config {
  token: string;
  accessRoleId?: string;
  pterodactylSettings: {
    url: string;
    apiKey: string;
  };
  servers: {
    id: string;
    nickname?: string;
    serverStatusChannelId?: string;
    consoleRelayChannelId?: string;
  }[];
  commandSettings: {
    info: {
      lockWithRole: boolean;
    };
  };
}
