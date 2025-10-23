import { User } from "./User";
import { Todo } from "./Todo";


User.hasMany(Todo,{foreignKey: "userId"});
Todo.belongsTo(User,{foreignKey: "userId"});

export {User,Todo};