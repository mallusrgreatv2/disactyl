# Pterodactyl Bot For Discord

This Discord bot integrates the Pterodactyl API so that you can start, stop, restart, and kill your servers within Discord itself. You can also have the bot relay console messages to a Discord channel, and send status changes (server started and stopped) to channels.

## Setup

- Clone the github repository: `git clone https://github.com/mallusrgreatv2/pterodactyl-bot`
- Cd into the folder: `cd pterodactyl-bot`
- Install packages: `npm i`
- Run the script to create config: `npm run config`
- Now the script has created a config for you to edit. Go to `src/config.ts` file and edit it to your liking.
- After editing the config, run the bot again: `npm run start`

## Changing bot messages

- /info: src/commands/info.ts:43
- /kill: src/commands/kill.ts:39
- /ping: src/commands/ping.ts:19
- /restart: src/commands/restart.ts:38
- /send: src/commands/send.ts:49
- /start: src/commands/start.ts:38
- /stop: src/commands/stop.ts:38

- server status change: src/listeners/ready.ts:83
- console relay: src/listeners/ready.ts:89
