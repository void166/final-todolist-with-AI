import jwt from 'jsonwebtoken'
import { User } from "../models/User"
import bcrypt from 'bcrypt'
import {config} from "../config/index";
import { Todo } from '../models/Todo';
import { Op } from 'sequelize';


const {JWT_SECRET}= config;

export const userService = {
    async users() {
        return User.findAll({
          include: [{ model: Todo, as: "todos" }],
        });
      },
    
      async user(id: string) {
        return User.findByPk(id, {
          include: [{ model: Todo, as: "todos" }],
        });
      },
      async getTodosByWeek(userId: string, startDate?: string) {
        const today = new Date();
        const weekStart = startDate ? new Date(startDate) : new Date(today);
      
        if (!startDate) {
          weekStart.setDate(today.getDate() - today.getDay());
        }
      
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
      
        return Todo.findAll({
          where: {
            userId,
            startDate: {
              [Op.between]: [weekStart, weekEnd],
            },
          },
          order: [["startDate", "ASC"]],
        });
      },
      
    async createUser(input:any){
        const {email, password}= input;
        if(!email || !password)
            throw new Error("email esvl pass aa oruulna uu");

        const user = await User.findOne({
            where: {email}
        });

        if(user)
            throw new Error("hereg;egch burtgeltei bnaa");

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            email, 
            password: hashedPassword
        });
         
        const token = jwt.sign({
            userId: newUser.id,
            email: newUser.email
        },JWT_SECRET,{
            expiresIn: "10d"
        });
        return {token, user: newUser}
    },
    async LoginUser(input:any){
        const {email, password} = input;
        if(!email || !password)
            throw new Error("email esvl pass oruul");

        const user = await User.findOne({
            where: {email}
        });
        if(!user)
            throw new Error(" hereglegch oldsongue");

        const valid = await bcrypt.compare(password, user.password);
        if(!valid)
            throw new Error(" pass buruu");

        const token = jwt.sign({
            userId: user.id,
            email: user.email
        },JWT_SECRET,{
            expiresIn: "10d"
        });

        console.log("user logged in: ", user.email)
        console.log("userId: ", user.id);
        return {user, token}
    }
}