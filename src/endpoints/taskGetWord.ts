import { OpenAPIRoute } from "chanfana";
import { stopwords_list } from "stopwords";
import { z } from "zod";

export class TaskGetWord extends OpenAPIRoute {
  schema = {
    tags: ["Words"],
    summary: "Fetch a random word and its definition and type",
    responses: {
      "200": {
        description: "Returns a random word with its definition and type",
        content: {
          "application/json": {
            schema: z.object({
              success: z.number(),
              word: z.string(),
              definition: z.string() || z.null(),
              type: z.string() || z.null(),
            }),
            examples: {
              not_null: {
                value: {
                  success: 200,
                  word: "metaphor",
                  definition:
                    "A figure of speech in which a word or phrase is applied to an object or action to which it is not literally applicable.",
                  type: "noun",
                },
              },
              null: {
                value: {
                  success: 200,
                  word: "metaphor",
                  definition: null,
                  type: null,
                },
              }
            },
          },
        },
      },
      "500": {
        description: "Server error",
        content: {
          "application/json": {
            schema: z.object({
              success: z.number(),
              error: z.string(),
            }),
            examples: {
              server_error: {
                value: {
                  success: 500,
                  error: "Failed to fetch dictionary data.",
                },
              },
            },
          },
        },
      },
    },
  };

  async handle(c) {
    // Get today's date & db string
    const today = new Date().toISOString().split("T")[0];
    const db = c.env.DB_PROD || c.env.DB_DEV; 

    try {
      // Check if the word for today exists in the database
      const result = await db.prepare(
        "SELECT word, definition, type FROM words_database WHERE date = ?"
      )
        .bind(today)
        .first();

      if (result) {
        // If the word exists, return it
        return {
          success: 200,
          word: result.word,
          definition: result.definition,
          type: result.type,
        };
      }

      // Fetch 10 random paragraphs of text from free tier API 
      const response = await fetch("http://metaphorpsum.com/paragraphs/10");
      if (!response.ok) throw new Error("Failed to fetch text data.");
      const textData = await response.text();

      // Process the text
      let words = textData
        .split(/\s+/) // Split text by whitespace
        .map((word) => word.toLowerCase().replace(/[^a-z]/g, "")) // Normalize words
        .filter(
          (word) =>
            word.length > 3 && word.length <= 10 && !stopwords_list.includes(word)
        ); // Filter out short, long, and stop words

      // Remove duplicates
      words = [...new Set(words)];

      // Pick a random word
      const randomWord = words[Math.floor(Math.random() * words.length)];

      // Fetch data from dictionary API about the random word
      const dictResponse = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${randomWord}`
      );
      if (!dictResponse.ok)
        throw new Error("Failed to fetch dictionary data.");
      const dictData = await dictResponse.json();

      // Extract definition and part of speech
      const definitionEntry = dictData[0]?.meanings[0]?.definitions[0];
      const definition = definitionEntry?.definition || null;
      const partOfSpeech =
        dictData[0]?.meanings[0]?.partOfSpeech || null;

      // Save the word to the database
      await db.prepare(
        "INSERT INTO words_database (date, word, definition, type) VALUES (?, ?, ?, ?)"
      )
        .bind(today, randomWord, definition, partOfSpeech)
        .run();

      // Return the response
      return {
        status: 200,
        word: randomWord,
        definition,
        type: partOfSpeech,
      };
    } catch (error) {
      console.error(error);
      return {
        success: 500,
        error: "An unknown error occurred.",
      };
    }
  }
}
