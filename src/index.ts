import { fromHono } from "chanfana";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { TaskGetWord } from "./endpoints/taskGetWord";
import { TaskGetCocktail } from "./endpoints/taskGetCoctail";

// Start a Hono app
const app = new Hono();

// Add CORS Middleware globally
app.use(
	"/*",
	cors({
		origin: ["http://localhost:3000", "https://kdafov.com", "http://localhost:5173"],
		allowMethods: ["GET", "OPTIONS"],
		allowHeaders: ["Content-Type"],
	})
);

// Setup OpenAPI registry
const openapi = fromHono(app, {
	docs_url: "/",
});

// Register OpenAPI endpoints
openapi.get("/api/word", TaskGetWord);
openapi.get("/api/coctail", TaskGetCocktail);

// Export the Hono app
export default app;
