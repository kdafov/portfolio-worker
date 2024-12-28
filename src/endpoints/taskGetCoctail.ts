import { OpenAPIRoute } from "chanfana";
import { z } from "zod";

export class TaskGetCocktail extends OpenAPIRoute {
  schema = {
    tags: ["Cocktails"],
    summary: "Fetch a random cocktail and its properties",
    responses: {
      "200": {
        description: "Returns a random cocktail with its properties",
        content: {
          "application/json": {
            schema: z.object({
              status: z.number(),
              name: z.string(),
              type: z.string(),
              glass: z.string(),
              ingredients: z.array(z.string()),
              imageSrc: z.string(),
            }),
            examples: {
              not_null: {
                value: {
                  status: 200,
                  name: "Addison",
                  type: "Coctail",
                  glass: "Martini Glass",
                  ingredients: ["Gin", "Vermouth"],
                  imageSrc: "https://www.thecocktaildb.com/images/media/drink/yzva7x1504820300.jpg",
                },
              },
            },
          },
        },
      },
      "500": {
        description: "Server error",
        content: {
          "application/json": {
            schema: z.object({
              status: z.number(),
              error: z.string(),
            }),
            examples: {
              server_error: {
                value: {
                  status: 500,
                  error: "An unknown error occurred.",
                },
              },
            },
          },
        },
      },
    },
  };

  async handle(c: any) {
    const today = new Date().toISOString().split("T")[0];
    const db = c.env.DB;

    if (!db) {
      return {
        status: 500,
        error: "Database binding is not defined.",
      };
    }

    try {
      // Check if a cocktail for today exists in the database
      const existingCocktail = await db
        .prepare("SELECT namestr, typestr, glass, ingredients, imageSrc FROM coctails WHERE datestr = ?")
        .bind(today)
        .first();

      if (existingCocktail) {
        return {
          status: 200,
          name: existingCocktail.namestr,
          type: existingCocktail.typestr,
          glass: existingCocktail.glass,
          ingredients: JSON.parse(existingCocktail.ingredients),
          imageSrc: existingCocktail.imageSrc,
        };
      }

      // Fetch a random cocktail from the API
      const response = await fetch("https://www.thecocktaildb.com/api/json/v1/1/random.php");
      if (!response.ok) {
        return {
            status: 500,
            error: "An error occurred while fetching data.",
        };
      }

      const apiData = (await response.json()) as { drinks: any[] };
      const cocktail = apiData.drinks[0];

      // Extract the ingredients from the cocktail response
      const ingredients = [];
      for (let i = 1; i <= 15; i++) {
        const ingredient = cocktail[`strIngredient${i}`];
        if (ingredient) {
          ingredients.push(ingredient);
        }
      }

      // Save the cocktail data to the database
      await db
        .prepare(
          "INSERT INTO coctails (datestr, namestr, typestr, glass, ingredients, imageSrc) VALUES (?, ?, ?, ?, ?, ?)"
        )
        .bind(today, cocktail.strDrink, cocktail.strCategory, cocktail.strGlass, JSON.stringify(ingredients), cocktail.strDrinkThumb)
        .run();

      // Return the cocktail data
      return {
        status: 200,
        name: cocktail.strDrink,
        type: cocktail.strCategory,
        glass: cocktail.strGlass,
        ingredients,
        imageSrc: cocktail.strDrinkThumb,
      };
    } catch (error) {
      console.error("Error fetching or saving cocktail data:", error);
      return {
        status: 500,
        error: error.message || "An unknown error occurred.",
      };
    }
  }
}
