import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { useServer } from 'graphql-ws/lib/use/ws';
import cors from 'cors';
import { json } from 'body-parser';
import { typeDefs } from './graphql/schemas/index';
import { resolvers } from './graphql/resolvers/index';
import { config } from './config';
import { authToken } from './auth/auth';
import { verifyToken } from './auth/verifyToken';

import sequelize from './config/db';
import { associations } from './models/association';


const { PORT } = config;


const app = express();
const httpServer = createServer(app);


const schema = makeExecutableSchema({ typeDefs, resolvers });


const wsServer = new WebSocketServer({
  server: httpServer,
  path: '/graphql',
});

const serverCleanup = useServer(
  {
    schema,
    context: async (ctx: any) => {
      const connectionParams = ctx.connectionParams as { authorization?: string, Authorization?: string } | null;
      const token = connectionParams?.authorization || connectionParams?.Authorization;
      if (!token) return {};

      const decoded = verifyToken(token);
      if (!decoded) return {};
      return { user: decoded };
    },
    onConnect: () => console.log("WebSocket client connected"),
    onDisconnect: () => console.log("WebSocket client disconnected"),
  },
  wsServer
);


const server = new ApolloServer({
  schema,
  plugins: [
    ApolloServerPluginDrainHttpServer({ httpServer }),
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose();
          },
        };
      },
    },
  ],
});



(async () => {
  try {
    associations();
    await sequelize.authenticate();
    console.log('Database connected');
    await sequelize.sync({ alter: true });
    console.log('Database synced');
  } catch (error) {
    console.error('Database connection error:', error);
  }
})();


async function startServer() {
  await server.start();

  app.use(
    '/graphql',
    cors(),
    json(),
    expressMiddleware(server, authToken)
  );

  httpServer.listen(PORT, () => {
    console.log(`HTTP Server ready at http://localhost:${PORT}/graphql`);
    console.log(`WebSocket Subscriptions ready at ws://localhost:${PORT}/graphql`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
