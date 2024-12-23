# OpenAPI Worker for Portfolio-v2 project

This is a Cloudflare Worker with OpenAPI 3.1 using [chanfana](https://github.com/cloudflare/chanfana) and [Hono](https://github.com/honojs/hono).

This is an API project made to service requests to my portfolio, mainly for minigames such as Word Of the Day, and more.

## Secret generation

1. npx wrangler secret put [secret_name]
2. Follow instructions
3. Access through "${secret_name}" in the wrangler.toml file

## Local database generation

1. npx wrangler d1 create minigame-db
2. npx wrangler d1 execute minigame-db --command "CREATE TABLE words_database (id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT UNIQUE, word TEXT NOT NULL, definition TEXT, type TEXT);"

## Project commands

1. Run `wrangler login` to login to your Cloudflare account in wrangler
2. Run `wrangler deploy` to publish the API to Cloudflare Workers
3. Run `wrangler dev` to start a local instance of the API.

## Project structure

1. Your main router is defined in `src/index.ts`.
2. Each endpoint has its own file in `src/endpoints/`.
3. For more information read the [chanfana documentation](https://chanfana.pages.dev/) and [Hono documentation](https://hono.dev/docs).