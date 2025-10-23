import express  from "express";
import sequelize from "./config/db";
import { config } from "./config";
import TodoRoutes from './routes/todoRoutes'
import AuthRoutes from './routes/authRoutes'
import  cors  from "cors";
import { Server} from "socket.io";

const {FRONTEND_URL, PORT} = config;

const app = express();


(async ()=>{
    await sequelize.sync({alter: true});
    console.log("database synced");
})();

app.use(express.json());


app.use(
    cors({
        origin: FRONTEND_URL,
    })
)

app.use('/api/todos', TodoRoutes);
app.use('/api/auth', AuthRoutes);

app.listen(PORT, ()=>{
    console.log(`runin on port ${PORT}`);
})