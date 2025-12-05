import Anthropic from "@anthropic-ai/sdk";
import { config } from "../config";
import { pubsub, AI_MESSAGE_EVENT } from "../graphql/pubsub";
import { Todo } from "../models/Todo";

const { ANTHROPIC_API_KEY } = config;

const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

class AiService {
  async chatWithAI(
    userId: string,
    payload: { message: string; conversationHistory?: any[] }
  ) {
    const { message, conversationHistory } = payload;
    if (!message) {
      return this.publish(userId, "ERROR", { message: "Message is empty" });
    }

    try {
      const todos = await Todo.findAll({
        where: { userId },
        order: [["startDate", "ASC"]],
        limit: 20,
      });

      const today = new Date().toISOString().split("T")[0];
      const systemPrompt = this.buildSystemPrompt(today, todos);

      const completion = anthropic.messages.stream({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          ...(conversationHistory || []),
          { role: "user", content: message },
        ],
      });

      let fullResponse = "";

      for await (const chunk of completion) {
        if (
          chunk.type === "content_block_delta" &&
          chunk.delta.type === "text_delta"
        ) {
          const text = chunk.delta.text;
          fullResponse += text;
          console.log(text);
          console.log(fullResponse);

          // Publish text chunk to subscription
          await this.publish(userId, "TEXT", { text });
        }
      }

      const parsed = this.parseAiResponse(fullResponse);

      if (!parsed.json) {
        return this.publish(userId, "DONE", {
          action: "reply",
          message: parsed.message,
        });
      }

      await this.handleAiAction(userId, parsed.json, parsed.message);
    } catch (error) {
      console.error("AI Service Error:", error);
      await this.publish(userId, "ERROR", {
        message: "Something went wrong with the AI service.",
      });
    }
  }

  private async publish(userId: string, type: string, payload: any = {}) {
    await pubsub.publish(`${AI_MESSAGE_EVENT}_${userId}`, {
      aiMessage: {
        type,
        ...payload,
      },
    });
  }

  private parseAiResponse(response: string) {
    const jsonStart = response.indexOf("{");
    const jsonEnd = response.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1)
      return { message: response, json: null };

    const jsonString = response.substring(jsonStart, jsonEnd + 1);
    const friendlyMessage = response.substring(0, jsonStart).trim();

    try {
      const json = JSON.parse(jsonString);
      return { message: friendlyMessage, json };
    } catch {
      return { message: response, json: null };
    }
  }

  private async handleAiAction(
    userId: string,
    actionData: any,
    friendlyMessage: string
  ) {
    const { action, todos } = actionData;

    if (action === "create_todo" && todos?.length > 0) {
      const created = await Promise.all(
        todos.map(async (t: any) => {
          const todo = await Todo.create({ ...t, userId, done: false });
          return todo.toJSON();
        })
      );
      return this.publish(userId, "DONE", {
        action,
        todos: created,
        message: friendlyMessage,
      });
    }

    if (action === "update_todo" && todos?.length > 0) {
      const updated = await Promise.all(
        todos.map(async (t: any) => {
          const todo = await Todo.findOne({ where: { id: t.id, userId } });
          if (!todo) return null;
          await Object.assign(todo, t);
          await todo.save();
          return todo.toJSON();
        })
      );
      return this.publish(userId, "DONE", {
        action,
        updatedTodos: updated.filter(Boolean),
        message: friendlyMessage,
      });
    }

    if (action === "delete_todo" && todos?.length > 0) {
      const deletedIds: string[] = [];
      for (const t of todos) {
        const todo = await Todo.findOne({ where: { id: t.id, userId } });
        if (todo) {
          deletedIds.push(todo.id);
          await todo.destroy();
        }
      }
      return this.publish(userId, "DONE", {
        action,
        deletedIds,
        deletedCount: deletedIds.length,
        message: friendlyMessage,
      });
    }

    return this.publish(userId, "DONE", {
      action: "reply",
      message: friendlyMessage,
    });
  }

  private buildSystemPrompt(today: string, todos: any[]) {
    const todoList =
      todos.length > 0
        ? todos
            .map(
              (t) =>
                `id: ${t.id}, title: ${t.title}, date: ${t.startDate}, done: ${t.done}`
            )
            .join("\n")
        : "No active todos.";

    return `
You are a helpful Todo assistant. Respond in Mongolian.

Today: ${today}
Current Todo List:
${todoList}

IMPORTANT: Your response must be in TWO parts:
1. Friendly message in Mongolian
2. JSON action

Format:
[Friendly message]
{"action":"...","todos":[...]}

Valid actions: create_todo, update_todo, delete_todo, reply
`;
  }
}

export const aiService = new AiService();
