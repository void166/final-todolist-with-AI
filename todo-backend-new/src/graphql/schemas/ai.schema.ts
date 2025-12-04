export const aiTypeDefs = `#graphql
  scalar Date

  type AIMessagePayload {
    type: AIMessageType!
    text: String
    action: String
    todos: [Todo]
    deletedIds: [ID]
    deletedCount: Int
    updatedTodos: [Todo]
    message: String
  }

  type AIMessage {
    text: String
    done: Boolean
    action: String
    message: String
    todos: [AIParsedTodo!]
  }

  type AIParsedTodo {
    id: ID
    title: String
    todoDate: Date
    done: Boolean
  }

  enum AIMessageType {
    TEXT
    DONE
    ERROR
  }

  input ConversationMessage {
    role: String!
    content: String!
  }

  type Mutation {
    sendAIMessage(message: String!, conversationHistory: [ConversationMessage]): Boolean!
  }

  type Subscription {
    aiMessage: AIMessagePayload
  }
`;