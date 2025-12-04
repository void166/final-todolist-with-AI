import { Model, Optional, DataTypes } from "sequelize";
import sequelize from "../config/db";

export interface todoAttributes {
  id: string;
  title: string;
  description?: string| null;
  status: "TODO" | "IN_PROGRESS" | "BLOCKED" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  startDate?: Date | null;
  dueDate?: Date | null;
  reminderDate?: Date | null;
  recurrence: "NONE" | "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  recurrenceRule?: string | null;
  projectId?: string | null;
  parentId?: string | null;
  userId: string;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

interface todoCreationAttributes
  extends Optional<todoAttributes, "id" | "description" | "status" | "priority" | "startDate" | "dueDate" | "reminderDate" | "recurrence" | "projectId" |"parentId"> {}

export class Todo
  extends Model<todoAttributes, todoCreationAttributes>
  implements todoAttributes
{
  declare id: string;
  declare title: string;
  declare description: string | null;
  declare status: "TODO" | "IN_PROGRESS" | "BLOCKED" | "DONE";
  declare priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  declare startDate: Date | null;
  declare dueDate: Date | null;
  declare reminderDate: Date | null;
  declare recurrence: "NONE" | "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  declare recurrenceRule: string | null;
  declare projectId: string | null;
  declare parentId: string | null;
  declare userId: string;
  declare createdAt: Date | null;
  declare updatedAt: Date | null;
}

Todo.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("TODO", "IN_PROGRESS", "BLOCKECD", "DONE"),
      defaultValue: "TODO",
    },
    priority: {
      type: DataTypes.ENUM("LOW", "MEDIUM", "HIGH", "URGENT"),
      defaultValue: "LOW",
    },
    startDate:{
      type: DataTypes.DATE,
      allowNull: true,
    },
    dueDate:{
      type: DataTypes.DATE,
      allowNull: true
    },
    reminderDate:{
      type: DataTypes.DATE,
      allowNull: true
    },
    recurrence:{
      type: DataTypes.ENUM("NONE", "DAILY", "WEEKLY", "MONTHLY", "YEARLY"),
      defaultValue: "NONE"
    },
    recurrenceRule:{
      type: DataTypes.STRING,
      allowNull: true
    },
    projectId:{
      type: DataTypes.UUID,
      allowNull: true
    },
    parentId:{
      type: DataTypes.UUID,
      allowNull: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "Todos",
    timestamps: true,
  }
);
