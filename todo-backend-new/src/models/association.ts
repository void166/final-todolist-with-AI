import { User } from "./User";
import { Todo } from "./Todo";
import { Project } from "./Project";

export const associations = () => {

  User.hasMany(Todo, { foreignKey: "userId", as: "todos" });
  Todo.belongsTo(User, { foreignKey: "userId", as: "user" });


  Project.hasMany(Todo, { foreignKey: "projectId", as: "todos" });
  Todo.belongsTo(Project, { foreignKey: "projectId", as: "project" });


  Todo.hasMany(Todo, { foreignKey: "parentId", as: "subtasks" });
  Todo.belongsTo(Todo, { foreignKey: "parentId", as: "parent" });
};
