import { Request, Response } from "express";
import { CreateTodoDTO, UpdateTodoDTO } from "../types/index";
import { Todo } from "../models/Todo";
import { Op } from "sequelize";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export {};

export class TodoController {
  async getTodo(req: Request, res: Response) {
    try {
      const todos = await Todo.findAll({
        where: {
          userId: req.userId,
        },
        order: [["createdAt", "DESC"]],
      });
      res.status(200).json({ success: true, todos });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getWeekTodos(req: Request, res: Response) {
    try {
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const todos = await Todo.findAll({
        where: {
          userId: req.userId,
          todoDate: {
            [Op.between]: [
              weekStart.toISOString().split("T")[0],
              weekEnd.toISOString().split("T")[0],
            ],
          },
        },
        order: [
          ["todoDate", "ASC"],
          ["createdAt", "ASC"],
        ],
      });

      res.status(200).json(todos);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async createTodo(req: Request, res: Response) {
    try {
      const input: CreateTodoDTO = req.body;

      if (!input.title)
        return res.status(400).json({ message: "Title required" });

      // if (!input.todoDate)
      //     return res.status(400).json({ message: "Todo date required" });

      const todo = await Todo.create({
        title: input.title,
        done: input.done || false,
        todoDate: input.todoDate,
        userId: req.userId!,
      });

      res.status(201).json(todo);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async updateTodo(req: Request, res: Response) {
    const { id } = req.params;
    const input: UpdateTodoDTO = req.body;

    try {
      const todo = await Todo.findOne({
        where: {
          id,
          userId: req.userId,
        },
      });

      if (!todo) return res.status(404).json({ message: "Todo not found" });

      if (input.title !== undefined) todo.title = input.title;
      if (input.done !== undefined) todo.done = input.done;

      await todo.save();

      res.status(200).json(todo);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async deleteTodo(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const todo = await Todo.findOne({
        where: {
          id,
          userId: req.userId,
        },
      });

      if (!todo)
        return res
          .status(404)
          .json({ success: false, message: "Todo not found" });

      await todo.destroy();
      res.status(200).json({ success: true, message: "Todo deleted" });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  }
}
