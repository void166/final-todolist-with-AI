import { DataType, DataTypes, Model, Optional } from "sequelize"
import sequelize from "../config/db";

export interface todoAttributes{
    id: string;
    title: string;
    todoDate: string;
    done: boolean;
    userId: string;
    createAt?: Date;
    updatedAt?: Date;
}

interface todoCreationAttributes extends Optional<todoAttributes, "id" | "done" | "createAt" | "updatedAt">{}


export class Todo extends Model <todoAttributes, todoCreationAttributes> implements todoAttributes{
    public id!: string;
    public title!: string;
    public todoDate!: string;
    public done!: boolean;
    public userId!: string;
}



Todo.init(
    {
        id:{
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            primaryKey: true
        },
        title:{
            type: DataTypes.STRING,
            allowNull: false,
        },
        done:{
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: false
        },
        todoDate:{
            type: DataTypes.DATEONLY,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        userId:{
            type: DataTypes.UUID,
            allowNull: false,
            references:{
                model: "Users",
                key: "id"
            }
        }
    },{
        sequelize,
        tableName: "Todos",
        timestamps: true
    }
)



