import type { Express } from "express";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";
import { jsonParser } from "../middleware/jsonParser.js";
import { buildGraphQLContext, resolvers, typeDefs } from "./schema.js";

const transportMode = (process.env.API_TRANSPORT || "both").toLowerCase();

export async function initGraphQL(app: Express) {
  if (transportMode === "rest") return;

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    formatError: (formattedError) => formattedError,
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
