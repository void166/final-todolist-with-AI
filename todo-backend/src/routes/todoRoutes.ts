import { Router } from "express";
import { TodoController } from "../controllers/Todo.controller";
import { authenticate } from "../middleware/auth";
import { AiController } from "../controllers/Ai.controller";

const router = Router();
const controller = new TodoController();
const aiController  = new AiController();

router.use(authenticate);


router.get('/', controller.getTodo);
router.get('/week', controller.getWeekTodos); 
router.post('/', controller.CreateTodo);
router.put('/:id', controller.UpdateTodo);
router.delete('/:id', controller.DeleteTodo);


//ai
router.post('/ai/chat/stream', aiController.chatWithAI)

export default router;
