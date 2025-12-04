import { Todo } from "../models/Todo"
import { User } from "../models/User"


export const resolver = {
    Query:{
        users: async()=>{
            return await User.findAll({ order: [["createdAt", "ASC"]] });
        },
        user: async(_parent: any, _args: {id: string})=>{
            const user = await User.findByPk(_args.id);

            if(!user)
                throw new Error("hereglegch oldsongu")
            return user;
        },
        todos: async(_parent: any, _args:{id: string}, context: {userId: string| null})=>{
            if(!context.userId)
                throw new Error("unauthorized");

            const todos = await Todo.findAll({
                where:{
                    userId: context.userId,
                },
                order: [["createdAt", "ASC"]]
            });

            return todos;
        },
        todo: async(_parent:any, _args: {id:string}, context: {userId: string | null})=>{
            if(!context.userId)
                throw new Error("unauthorized");

            const todo = await Todo.findOne({
                where:{
                    userId: context.userId,
                    id: _args.id
                }
            });
            return todo;

        }
    },
    Mutation:{
        createTodo: async (
            _parent: any,
            _args: { input: { title: string; todoDate?: Date; done?: boolean } },
            context: { userId: string | null }
          ) => {
            if (!context.userId) throw new Error("Unauthorized");
      
            const { title, done, todoDate } = _args.input;
      
            const todo = await Todo.create({
              title,
              todoDate: todoDate ? todoDate.toISOString() : undefined,
              done: done || false,
              userId: context.userId,
            });
            return todo;
          },
          updateTodo: async (
            _parent: any,
            _args: { id: string; input: { title?: string; todoDate?: Date; done?: boolean } },
            context: { userId: string | null }
          ) => {
            if (!context.userId) throw new Error("Unauthorized");
      
            const todo = await Todo.findOne({
              where: { id: _args.id, userId: context.userId },
            });
            if (!todo) throw new Error("Todo not found");
      
            if (_args.input.title !== undefined) todo.title = _args.input.title;
            if (_args.input.todoDate !== undefined) todo.todoDate = _args.input.todoDate.toISOString();
            if (_args.input.done !== undefined) todo.done = _args.input.done;
      
            await todo.save();
            return todo;
          },
          deleteTodo: async (_parent: any, _args: { id: string }, context: { userId: string | null }) => {
            if (!context.userId) throw new Error("Unauthorized");
      
            const todo = await Todo.findOne({
              where: { id: _args.id, userId: context.userId },
            });
            if (!todo) throw new Error("Todo not found");
      
            await todo.destroy();
            return true;
          },
    },

    User:{
      Todo: async(parent:any)=>{
        await Todo.findByPk(parent.id)
      },
    },
    Todo:{
      User: async(parent:any)=>{
        await User.findByPk(parent.id);
      }
    }
}