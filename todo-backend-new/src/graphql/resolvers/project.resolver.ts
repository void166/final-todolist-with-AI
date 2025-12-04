import { Project } from "../../models/Project";
import { Todo } from "../../models/Todo";

export const projectResolvers = {
  Query: {
    projects: async (_: any, __: any, context: any) => {
      return Project.findAll({ where: { userId: context.user.userId } });
    },

    project: async (_: any, { id }: any, context: any) => {
      return Project.findOne({ where: { id, userId: context.user.userId } });
    },
  },

  Mutation: {
    createProject: async (_: any, { input }: any, context: any) => {
      return Project.create({
        name: input.name,
        userId: context.user.userId,
      });
    },
  },

  Project: {
    todos: async (project: any) => {
      return Todo.findAll({
        where: { projectId: project.id },
      });
    }
  }
};
