import { Optional, Model, DataTypes } from "sequelize";
import sequelize from "../config/db";

export interface userAttributes{
    id: string;
    email: string;
    password: string,
    createdAt?: Date | null;
    updatedAt?: Date | null;
}

 interface userCreationAttributes extends Optional<userAttributes,"id"| "createdAt"| "updatedAt">{}

export class User extends Model <userAttributes, userCreationAttributes> implements userAttributes{
    declare id: string;
    declare email: string;
    declare password: string;
    declare createdAt: Date;
    declare updatedAt: Date;
}

User.init({
    id:{
        type: DataTypes.UUID,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    email:{
        type: DataTypes.STRING,
        allowNull: false
    },
    password:{
        type: DataTypes.STRING,
        allowNull: false,
    },
},{
    sequelize,
    tableName: "Users",
    timestamps: true
});

