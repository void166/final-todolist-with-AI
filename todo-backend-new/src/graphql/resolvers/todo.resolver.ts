import { todoService } from "../../services/todoService";

const {
  create,
  update,
  deleteTodo,
  getUserTodos,
  getTodoById,
  addDescription,
  addSevenDayTodo,
  getProjectTodos,
  getSubTasks,
  createSubTask,
  createRecurringTodos,
  setReminder,
  filterTodos
} = todoService;

interface JWTPayload {
  userId: string;
  email: string;
}

export const todoResolver = {
  Query: {
    todos: (_: any, __: any, { user }: any) => {
      if (!user) throw new Error("Not authenticated");
      return getUserTodos(user.userId);
    },

    todo: (_: any, { id }: any, { user }: any) => {
      if (!user) throw new Error("Not authenticated");
      return getTodoById(id, user.userId);
    },

    subtasks: (_: any, { parentId }: any, { user }: any) => {
      if (!user) throw new Error("Not authenticated");
      return getSubTasks(parentId, user.userId);
    },

    projectTodos: (_: any, { projectId }: any, { user }: any) => {
      if (!user) throw new Error("Not authenticated");
      return getProjectTodos(projectId, user.userId);
    },

    filterTodos: (_: any, { query }: any, { user }: any) => {
      if (!user) throw new Error("Not authenticated");
      return filterTodos(query, user.userId);
    }
  },

  Mutation: {
    createTodo: (_: any, { input }: any, { user }: any) => {
      if (!user) throw new Error("Not authenticated");
      return create(input, user.userId);
    },

    updateTodo: (_: any, { input }: any, { user }: any) => {
      if (!user) throw new Error("Not authenticated");
      return update(input, user.userId);
    },

    deleteTodo: (_: any, { id }: any, { user }: any) => {
      if (!user) throw new Error("Not authenticated");
      return deleteTodo(id, user.userId);
    },

    addDescription: (_: any, { input }: any, { user }: any) => {
      if (!user) throw new Error("Not authenticated");
      return addDescription(input.description, user.userId, input.todoId);
    },

    addSevenDayTodo: (_: any, { input }: any, { user }: any) => {
      if (!user) throw new Error("Not authenticated");
      return addSevenDayTodo(input, user.userId);
    },

    createSubTask: async (_: any, { input }: any, { user }: any) => {
      if (!user) throw new Error("Not authenticated");
      const parent = await getTodoById(input.parentId, user.userId);
      if (!parent) throw new Error("Parent todo not found");
      
      return createSubTask(input.parentId, input, user.userId);
    },

    createRecurringTodos: (_: any, { input }: any, { user }: any) => {
      if (!user) throw new Error("Not authenticated");
      return createRecurringTodos(input, user.userId);
    },

    setReminder: (_: any, { input }: any, { user }: any) => {
      if (!user) throw new Error("Not authenticated");
      return setReminder(input.todoId, user.userId, input.date);
    }
  },

  Todo: {
    subtasks: async (parent: any, _: any, { user }: any) => {
      if (!user) return [];
      return getSubTasks(parent.id, user.userId);
    }
  }
};