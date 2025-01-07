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
              status: z.number(),
              word: z.string(),
              definition: z.string() || z.null(),
              type: z.string() || z.null(),
            }),
            examples: {
              not_null: {
                value: {
                  status: 200,
                  word: "metaphor",
                  definition:
                    "A figure of speech in which a word or phrase is applied to an object or action to which it is not literally applicable.",
                  type: "noun",
                },
              },
              null: {
                value: {
                  status: 200,
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
              status: z.number(),
              error: z.string(),
            }),
            examples: {
              server_error: {
                value: {
                  status: 500,
                  error: "Failed to fetch data.",
                },
              },
            },
          },
        },
      },
    },
  };

  async handle(c: any) {
    const FIXED_WORD = "magic";

    const today = new Date().toISOString().split("T")[0];
    const db = c.env.DB;

    if (!db) {
      // [DEV]: Log the error
      console.error("An error occurred while connecting to the database.");

      return {
        status: 500,
        error: "An error occurred while connecting to the database.",
      };
    }

    const fetchWord = async () => {
      const response = await fetch("http://metaphorpsum.com/paragraphs/20/20");
      if (!response.ok) return null;

      const textData = await response.text();
      let words = textData
        .split(/\s+/)
        .map((word) => word.toLowerCase().replace(/[^a-z]/g, ""))
        .filter(
          (word) =>
            word.length > 3 && word.length <= 7 && !stopwords_list.includes(word)
        );

      words = [...new Set(words)];
      return words;
    };

    const isWordInLastThreeMonths = async (word: string) => {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      const threeMonthsAgoStr = threeMonthsAgo.toISOString().split("T")[0];

      const result = await db.prepare(
        "SELECT 1 FROM words WHERE word = ? AND datestr >= ?"
      )
        .bind(word, threeMonthsAgoStr)
        .first();

      return !!result;
    };

    const getRandomWeightedWord = (words: string[]) => {
      const fiveLetterWords = words.filter(word => word.length === 5);
      const otherWords = words.filter(word => word.length !== 5);

      const weightedWords = [
        ...fiveLetterWords.map(word => ({ word, weight: 0.4 / fiveLetterWords.length })),
        ...otherWords.map(word => ({ word, weight: 0.6 / otherWords.length })),
      ];

      const random = Math.random();
      let cumulativeWeight = 0;

      for (const { word, weight } of weightedWords) {
        cumulativeWeight += weight;
        if (random < cumulativeWeight) {
          return word;
        }
      }

      return FIXED_WORD;
    };

    try {
      const result = await db.prepare(
        "SELECT word, explanation, wordtype FROM words WHERE datestr = ?"
      )
        .bind(today)
        .first();

      if (result) {
        return {
          status: 200,
          word: result.word,
          definition: result.explanation,
          type: result.wordtype,
        };
      }

      let randomWord = null;
      for (let attempt = 1; attempt <= 3; attempt++) {
        const words = await fetchWord();
        if (!words) continue;

        randomWord = getRandomWeightedWord(words);
        if (randomWord && !(await isWordInLastThreeMonths(randomWord))) {
          break;
        }
        if (attempt === 3) {
          randomWord = FIXED_WORD;
        }
      }

      const dictResponse = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${randomWord}`
      );
      if (!dictResponse.ok) {
        // [DEV]: Log the error
        console.error(dictResponse);

        return {
          status: 500,
          error: "An error occurred while fetching word definition.",
        };
      }

      const dictData: Array<{
        meanings: Array<{
          definitions: Array<{ definition: string }>;
          partOfSpeech: string;
        }>;
      }> = await dictResponse.json();
      
      const meanings = dictData.flatMap((entry: { meanings: Array<{ definitions: Array<{ definition: string }>, partOfSpeech: string }> }) => entry.meanings || []);
      
      // Prioritize nouns and pick the first matching definition and type
      const prioritizedMeaning = meanings.find((meaning: { partOfSpeech: string }) => meaning.partOfSpeech === "noun") || meanings[0];
      const selectedDefinition = prioritizedMeaning?.definitions[0]?.definition || null;
      const selectedType = prioritizedMeaning?.partOfSpeech || null;
      
      await db.prepare(
        "INSERT INTO words (datestr, word, explanation, wordtype) VALUES (?, ?, ?, ?)"
      )
        .bind(today, randomWord, selectedDefinition, selectedType)
        .run();
      
      return {
        status: 200,
        word: randomWord,
        definition: selectedDefinition,
        type: selectedType,
      };
      
    } catch (error) {
      // [DEV]: Log the error
      console.error(error);

      return {
        status: 500,
        error: "An unknown error occurred.",
      };
    }
  }
}
