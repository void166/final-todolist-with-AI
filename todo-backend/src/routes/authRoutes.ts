import { Router } from "express";
import { AuthController } from "../controllers/Auth.controller";

const router = Router();
const controller = new AuthController();

router.post('/signup', controller.signUp);
router.post('/login', controller.Login);

export default router;