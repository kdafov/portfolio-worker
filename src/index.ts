import { fromHono } from "chanfana";
import { Hono } from "hono";
import { TaskGetWord } from "./endpoints/taskGetWord";

// Start a Hono app
const app = new Hono();

// Setup OpenAPI registry
const openapi = fromHono(app, {
	docs_url: "/",
});

// Register OpenAPI endpoints
openapi.get("/api/word", TaskGetWord);

// Export the Hono app
export default app;
