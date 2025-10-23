import { Optional, DataType, Model, DataTypes, UUIDV4 } from "sequelize";
import sequelize from "../config/db";

export interface userAttributes{
    id: string;
    email: string;
    password: string,
    createdAt?: Date;
    updatedAt?: Date;
}

interface userCreationAttributes extends Optional<userAttributes,"id"| "createdAt"| "updatedAt">{}

export class User extends Model <userAttributes, userCreationAttributes> implements userAttributes{
    public id!: string;
    public email!: string;
    public password!: string;
}

User.init({
    id:{
        type: DataTypes.UUID,
        allowNull: false,
        defaultValue: UUIDV4,
        primaryKey: true
    },
    email:{
        type: DataTypes.STRING,
        allowNull: false
    },
    password:{
        type: DataTypes.STRING,
        allowNull: false,
    }
},{
    sequelize,
    tableName: "Users",
    timestamps: true
})