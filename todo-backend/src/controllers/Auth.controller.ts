import bcrypt from "bcryptjs";
import { User } from "../models/User";
import { Request, Response } from "express";
import { config } from "../config/index";
import jwt from "jsonwebtoken";
import { LoginUpDTO, SignUpDTO } from "../types/index";

const { JWT_SECRET } = config;

export class AuthController {
  async signUp(req: Request, res: Response) {
    try {
      const input: SignUpDTO = req.body;

      if (!input.email || !input.password)
        return res
          .status(400)
          .json({ succsess: false, message: " email esvl pass aa oruulaarao" });

      const existingUser = await User.findOne({
        where: { email: input.email },
      });

      if (existingUser)
        return res
          .status(400)
          .json({ success: false, message: "burtgegdsen hereglegch bnda" });

      const hashedPass = await bcrypt.hash(input.password, 10);

      const newUser = await User.create({
        email: input.email,
        password: hashedPass,
      });

      res.status(200).json({ success: true, message: { newUser } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async Login(req: Request, res: Response) {
    try {
      const input: LoginUpDTO = req.body;

      if (!input.email || !input.password)
        return res
          .status(400)
          .json({ succsess: false, message: " email esvl pass aa oruulaarao" });

      const user = await User.findOne({
        where: {
          email: input.email,
        },
      });

      if (!user)
        return res
          .status(400)
          .json({ succsess: false, message: "iim hereglegch bhgul bnadaa" });

      const isMatch = await bcrypt.compare(input.password, user.password);

      if (!isMatch)
        return res
          .status(400)
          .json({ success: false, message: "password buruu bnshu broder" });

      const token = jwt.sign(
        {
          id: user.id,
        },
        JWT_SECRET,
        {
          expiresIn: "1d",
        }
      );

      res.status(200).json({
        succsess: true,
        user: user,
        token,
        message: "login amjilttai shu naizaa",
      });
    } catch (error: any) {}
  }
}
