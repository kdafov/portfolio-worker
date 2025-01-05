import { OpenAPIRoute } from "chanfana";
import { z } from "zod";

export class TaskCheckWord extends OpenAPIRoute {
    schema = {
        tags: ["Words"],
        summary: "Check if a word exists",
        request: {
            body: {
                content: {
                    "application/json": {
                        schema: z.object({
                            word: z.string(),
                        }),
                        examples: {
                            valid: {
                                value: {
                                    word: "security",
                                },
                            },
                            invalid: {
                                value: {
                                    word: "notavalidword",
                                },
                            },
                        },
                    },
                },
            }
        },
        responses: {
            "200": {
                description: "Returns whether the word exists or not",
                content: {
                    "application/json": {
                        schema: z.object({
                            status: z.number(),
                            exists: z.boolean(),
                        }),
                        examples: {
                            exists: {
                                value: {
                                    status: 200,
                                    exists: true,
                                },
                            },
                            not_exists: {
                                value: {
                                    status: 200,
                                    exists: false,
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
        }
    };

    async handle(c: any) {
        try {
            const body = await c.req.json();
            const { word } = body;

            const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);

            if (response.ok) {
                return {
                    status: 200,
                    exists: true,
                };
            } else if (response.status === 404) {
                return {
                    status: 200,
                    exists: false,
                };
            } else {
                // [DEV]: Log the error
                console.error("An error occurred with status: " + response.statusText);

                return {
                    status: 500,
                    error: "An error occurred while checking the word.",
                };
            }
        } catch (error) {
            // [DEV]: Log the error
            console.error("An error occurred: " + error);

            return {
                status: 500,
                error: "An unknown error occurred.",
            };
        }
    }
}