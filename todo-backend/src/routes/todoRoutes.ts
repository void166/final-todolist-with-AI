import { Router } from "express";
import { TodoController } from "../controllers/Todo.controller";
import { AiController } from "../controllers/Ai.controller";
import { authenticate } from "../middleware/auth";


const router = Router();
const controller = new TodoController();
const aiController  = new AiController();



router.use(authenticate);


router.get('/', controller.getTodo);
router.get('/week', controller.getWeekTodos); 
router.post('/', controller.createTodo);
router.put('/:id', controller.updateTodo);
router.delete('/:id', controller.deleteTodo);




export default router;
