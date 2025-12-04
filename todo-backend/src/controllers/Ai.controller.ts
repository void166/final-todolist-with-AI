import { Response, Request } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { config } from "../config";
import { Socket } from "socket.io";
import { Todo } from "../models/Todo";

const { ANTHROPIC_API_KEY } = config;

const anthropic = new Anthropic({
  apiKey: ANTHROPIC_API_KEY,
});

export class AiController {
  static async chatWithAI(socket: Socket, payload: any) {
    console.log("chatWithAI called");
    console.log("Payload received:", payload);
    console.log("Socket.data.userId:", socket.data.userId);

    try {
      const { message, conversationHistory } = payload;

      const userId = socket.data.userId;

      console.log("UserId:", userId);
      console.log("Message:", message);

      if (!message) {
        console.log("Message is empty");
        socket.emit("ai:error", {
          message: "Message hooson baina juu",
        });
        return;
      }

      if (!userId) {
        console.log("UserId is missing");
        socket.emit("ai:error", {
          message: "User not authenticated",
        });
        return;
      }


      const userTodos = await Todo.findAll({
        where: { userId },
        order: [["todoDate", "ASC"]],
        limit: 20,
      });

      console.log("User todos loaded:", userTodos.length);

      const today = new Date().toISOString().split("T")[0];
      const tomorrow = new Date(Date.now() + 86400000)
        .toISOString()
        .split("T")[0];

      const systemPrompt = `
You are Todo assistant for the user. Handle 4 actions.

Today: ${today}
Tomorrow: ${tomorrow}
Одоогийн Todo List:
${
  userTodos.length > 0
    ? userTodos
        .map(
          (t) =>
            `id: ${t.id}, title: ${t.title}, date: ${t.todoDate}, done: ${t.done}`
        )
        .join("\n")
    : "Одоогоор Todo байхгүй байна"
}
      
Examples:
- "Add water reminder for tomorrow":
{"action":"create_todo","todos":[{"title":"Water","todoDate":"${tomorrow}"}]}

- "Delete water reminder for tomorrow":
{"action":"delete_todo","todos":[{"title":"Water","todoDate":"${tomorrow}"}]}
 a
- "What are my todos?":
{"action":"reply","message":"You have ..."}

- "Update todo":
{"action":"update_todo","todos":[{"id":42,"title":"Water","todoDate":"${tomorrow}","done":false}]}
`;

      console.log("🚀 Starting Claude stream...");

      const completion = await anthropic.messages.stream({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        system: systemPrompt,
        stream: true,
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

          console.log("Streaming chunk:", text);
          socket.emit("ai:text", { text });
        }
      }

      console.log("Full response:", fullResponse);

      const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        console.log("No JSON found, sending as reply");
        socket.emit("ai:done", {
          action: "reply",
          message: fullResponse,
        });
        return;
      }

      let parsed;
      try {
        parsed = JSON.parse(jsonMatch[0]);
        console.log("Parsed JSON:", parsed);
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        socket.emit("ai:done", {
          action: "reply",
          message: fullResponse,
        });
        return;
      }

      if (parsed.action === "create_todo" && parsed.todos?.length > 0) {
        console.log("➕ Creating todos:", parsed.todos);
        const createdTodos = await Promise.all(
          parsed.todos.map(async (todo: any) => {
            const newTodo = await Todo.create({
              title: todo.title,
              todoDate: todo.todoDate,
              done: false,
              userId,
            });
            return newTodo.toJSON();
          })
        );
        console.log("Todos created:", createdTodos);
        socket.emit("ai:done", {
          action: "create_todo",
          todos: createdTodos,
          message: `${createdTodos.length} todos created`,
        });
      } else if (parsed.action === "delete_todo" && parsed.todos?.length > 0) {
        console.log("Deleting todos:", parsed.todos);
        const deleteResults = await Promise.all(
          parsed.todos.map(async (todo: any) => {
            const foundTodo = await Todo.findOne({
              where: {
                title: todo.title,
                todoDate: todo.todoDate,
                userId,
              },
            });
            if (foundTodo) {
              const todoId = foundTodo.id;
              await foundTodo.destroy();
              return todoId;
            }
            return null;
          })
        );

        const deletedIds = deleteResults.filter((id) => id !== null);
        console.log("Todos deleted:", deletedIds);

        socket.emit("ai:done", {
          action: "delete_todo",
          deletedIds,
          deletedCount: deletedIds.length,
          message: `${deletedIds.length} deleted`,
        });
      } else if (parsed.action === "update_todo" && parsed.todos?.length > 0) {
        console.log("Updating todos:", parsed.todos);
        const updatedTodos = await Promise.all(
          parsed.todos.map(async (todoData: any) => {
            const todo = await Todo.findOne({
              where: { id: todoData.id, userId },
            });
            if (!todo) return null;

            if (todoData.title !== undefined) todo.title = todoData.title;
            if (todoData.todoDate !== undefined)
              todo.todoDate = todoData.todoDate;
            if (todoData.done !== undefined) todo.done = todoData.done;

            await todo.save();
            return todo.toJSON();
          })
        );

        const filteredTodos = updatedTodos.filter((t) => t !== null);
        console.log("Todos updated:", filteredTodos);

        socket.emit("ai:done", {
          action: "update_todo",
          updatedTodos: filteredTodos,
          message: `${filteredTodos.length} todo shinechlegdlee`,
        });
      } else {
        console.log("Sending reply");
        socket.emit("ai:done", {
          action: "reply",
          message: parsed.message || fullResponse,
        });
      }
    } catch (error: any) {
      console.error("AI Chat Error:", error);
      console.error("Error stack:", error.stack);
      socket.emit("ai:error", { message: error.message || "Unknown error" });
    }
  }
}
