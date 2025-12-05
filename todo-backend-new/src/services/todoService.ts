import { Todo } from "../models/Todo";
import { Project } from "../models/Project";
import { buildTodoInput } from "../utils/input";
import { validateTodoInput } from "../utils/validation";
import { Op } from "sequelize";

export const todoService = {
  getUserTodos: async (userId: string) => {
    return await Todo.findAll({ where: { userId } });
  },

  getTodoById: async (id: string, userId: string) => {
    return await Todo.findOne({ where: { id, userId } });
  },

  create: async (input: any, userId: string) => {
    validateTodoInput(input);
    return await Todo.create(buildTodoInput(input, userId));
  },

  update: async (input: any, userId: string) => {
    const todo = await todoService.getTodoById(input.id, userId);
    if (!todo) throw new Error("Todo not found");

    return await todo.update(buildTodoInput(input, userId));
  },

  deleteTodo: async (id: string, userId: string) => {
    const todo = await todoService.getTodoById(id, userId);
    if (!todo) throw new Error("Todo not found");
    await todo.destroy();
    return true;
  },

  addDescription: async (
    description: string,
    userId: string,
    todoId: string
  ) => {
    if (!description) throw new Error("description cannot be empty");

    const todo = await Todo.findOne({ where: { id: todoId, userId } });
    if (!todo) throw new Error("Todo not found");

    return await todo.update({ description });
  },

  createSubTask: async (parentId: string, input: any, userId: string) => {
    const parent = await todoService.getTodoById(parentId, userId);
    if (!parent) throw new Error("Parent todo not found");

    return await Todo.create({
      ...buildTodoInput({ ...input, parentId }, userId),
      parentId,
    });
  },

  getSubTasks: async (todoId: string, userId: string) => {
    return await Todo.findAll({ where: { parentId: todoId, userId } });
  },

  getProjectTodos: async (projectId: string, userId: string) => {
    return await Todo.findAll({ where: { projectId, userId } });
  },

  addSevenDayTodo: async (input: any, userId: string) => {
    validateTodoInput(input);

    const startDate = input.startDate ? new Date(input.startDate) : new Date();
    const todos: any[] = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      const todo = await Todo.create({
        ...buildTodoInput(input, userId),
        startDate: date,
      });

       todos.push(todo);
    }
    return todos;
  },

  createRecurringTodos: async (input: any, userId: string) => {
    validateTodoInput(input);

    const recurrence = input.recurrence || "NONE";
    if (recurrence === "NONE") return todoService.create(input, userId);

    const todos: any[] = [];
    const initialDate = input.startDate
      ? new Date(input.startDate)
      : new Date();
    let date = new Date(initialDate);

    const MAX_OCCURRENCES = input.occurrences ? Number(input.occurrences) : 12;

    for (let i = 0; i < MAX_OCCURRENCES; i++) {
      const todo = await Todo.create({
        ...buildTodoInput(input, userId),
        startDate: new Date(date),
      });

      if (recurrence === "DAILY") date.setDate(date.getDate() + 1);
      else if (recurrence === "WEEKLY") date.setDate(date.getDate() + 7);
      else if (recurrence === "MONTHLY") date.setMonth(date.getMonth() + 1);
      else if (recurrence === "YEARLY")
        date.setFullYear(date.getFullYear() + 1);
      else break;

      todos.push(todo);
    }

    return todos;
  },

  setReminder: async (todoId: string, userId: string, date: Date) => {
    const todo = await todoService.getTodoById(todoId, userId);
    if (!todo) throw new Error("Todo not found");

    return await todo.update({ reminderDate: date });
  },

  async filterTodos(query: any, userId: string) {
    const where: any = { userId };

    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.projectId) where.projectId = query.projectId;

    if (query.startDateFrom || query.startDateTo) {
      where.startDate = {};
      if (query.startDateFrom)
        where.startDate[Op.gte] = new Date(query.startDateFrom);
      if (query.startDateTo)
        where.startDate[Op.lte] = new Date(query.startDateTo);
    }

    if (query.dueDateFrom || query.dueDateTo) {
      where.dueDate = {};
      if (query.dueDateFrom)
        where.dueDate[Op.gte] = new Date(query.dueDateFrom);
      if (query.dueDateTo) where.dueDate[Op.lte] = new Date(query.dueDateTo);
    }

    return await Todo.findAll({ where });
  },
};
