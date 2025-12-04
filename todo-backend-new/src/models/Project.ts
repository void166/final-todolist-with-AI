import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";

export interface projectAttributes{
    id: string;
    name: string;
    userId: string;
}

interface projectCreationAttributes extends Optional<projectAttributes, "id">{}

export class Project extends Model<projectAttributes,projectCreationAttributes>implements projectAttributes{
    declare id: string;
    declare name: string;
    declare userId: string;
}

Project.init({
    id:{
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false
    }
},{
    sequelize,
    tableName: "Projects",
    timestamps: true
})