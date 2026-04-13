import type { Express } from "express";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";
import type { GraphQLFormattedError } from "graphql";
import { ZodError } from "zod";
import { jsonParser } from "../middleware/jsonParser.js";
import { buildGraphQLContext, resolvers, typeDefs } from "./schema.js";
import { AppError } from "../utils/AppError.js";

const transportMode = (process.env.API_TRANSPORT || "rest").toLowerCase();

function extractZodMessage(error: ZodError) {
  return error.issues
    .map((issue) => `${issue.path.join(".") || "input"}: ${issue.message}`)
    .join(" | ");
}

function parseArrayLikeMessage(message: string) {
  if (!message.trim().startsWith("[")) return null;
  try {
    const parsed = JSON.parse(message);
    if (!Array.isArray(parsed)) return null;
    const readable = parsed
      .map((item) =>
        item?.path?.length
          ? `${item.path.join(".")}: ${item.message}`
          : item?.message || null,
      )
      .filter(Boolean);
    return readable.length ? readable.join(" | ") : null;
  } catch {
    return null;
  }
}

function formatGraphQLError(
  formattedError: GraphQLFormattedError,
  error: unknown,
) {
  const originalError = (error as { originalError?: unknown })?.originalError;

  if (originalError instanceof AppError) {
    return { ...formattedError, message: originalError.message };
  }

  if (originalError instanceof ZodError) {
    return { ...formattedError, message: extractZodMessage(originalError) };
  }

  const parsedMessage = parseArrayLikeMessage(formattedError.message);
  if (parsedMessage) {
    return { ...formattedError, message: parsedMessage };
  }

  return formattedError;
}

export async function initGraphQL(app: Express) {
  if (transportMode !== "graphql") return;

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    formatError: formatGraphQLError,
  });

  await server.start();

  app.use(
    "/graphql",
    jsonParser,
    expressMiddleware(server, {
      context: async ({ req, res }) => buildGraphQLContext(req, res),
    }),
  );
}
