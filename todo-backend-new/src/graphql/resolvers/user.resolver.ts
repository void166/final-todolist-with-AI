import { Todo } from "../../models/Todo";
import { User } from "../../models/User";
import { config } from "../../config";
import { userService } from "../../services/userService";


const {createUser, LoginUser}= userService;


interface JWTPayload {
  userId: string;
  email: string;
}

export const userResolver = {
  Query: {
    users: async () => {
      return await User.findAll({
        include: [{ model: Todo, as: "todos" }],
      });
    },

    user: async (_: any, args: { id: string }) => {
      return await User.findByPk(args.id, {
        include: [{ model: Todo, as: "todos" }],
      });
    },

    getTodosByWeek: (_: any, { startDate }: { startDate?: string }, context: { user?: JWTPayload }) => {
      if (!context.user) throw new Error("Not authenticated");
      return userService.getTodosByWeek(context.user.userId, startDate);
    },
  },

  Mutation: {
    createUser: async (_: any, { input }: any) => {
      return createUser(input);
    },

    loginUser: async (_: any, { input }: any) => {
      return LoginUser(input);
    },
  },
};
