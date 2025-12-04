// src/graphql/resolvers/ai.resolver.ts
import { aiService } from "../../services/aiService";
import { AI_MESSAGE_EVENT, pubsub } from "../pubsub";

interface JWTPayload {
  userId: string;
  email: string;
}

export const aiResolver = {
  Mutation: {
    sendAIMessage: async (_: any, args: any, context: { user?: JWTPayload }) => {
      const { message, conversationHistory } = args;
      const { user } = context;

      if (!user) throw new Error("Not authenticated");

      aiService.chatWithAI(user.userId, { message, conversationHistory })
        .catch(err => console.error("❌ AI Service Error:", err));

      return true;
    },
  },

  Subscription: {
    aiMessage: {
      subscribe: (_: any, __: any, context: { user?: JWTPayload }) => {
        if (!context.user) {
          throw new Error("Not authenticated");
        }
        
        const channel = `${AI_MESSAGE_EVENT}_${context.user.userId}`;
        console.log(`📡 User ${context.user.userId} subscribed to ${channel}`);
      
        return pubsub.asyncIterator([channel]);
      },
    },
  },
};