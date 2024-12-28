# OpenAPI Worker for Portfolio-v2 project

This is a Cloudflare Worker with OpenAPI 3.1 using [chanfana](https://github.com/cloudflare/chanfana) and [Hono](https://github.com/honojs/hono).

This is an API project made to service requests to my portfolio, mainly for minigames such as Word Of the Day, and more.

Currently providing:
- Random word (daily)
- Random coctail (daily)

Available at: https://kdafov-services-worker.kdafov.workers.dev

## Setup
1. (One-time) Create database by running ```npm run create-db```
2. (One-time) Copy the credentials printed in the console to the `wrangler.toml` file
3. (One-time) Populate the newly created table with data by running ```npm run populate-db```
4. Check the database content locally by running ```npm run validate-db-local```
5. (Optional) Populate the remote database with data by running ```npm run populate-db-remote```
6. Check the remote database content by running ```npm run validate-db-remote```

## Adding environmental variables
Add ENV by running: `npx wrangler secret put <KEY>`

Replace ```database_id = ${id}``` in the `wrangler.toml` file with the actual database ID.

## Local run
1. Run ```npm run dev``` to start the development server
2. Access OpenAPI Swagger endpoints at `http://localhost:8787`

## Deployment
1. Run ```npm run deploy``` to deploy project to Cloudflare