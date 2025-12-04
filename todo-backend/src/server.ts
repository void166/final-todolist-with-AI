import express from "express";
import sequelize from "./config/db";
import { config } from "./config";
import TodoRoutes from "./routes/todoRoutes";
import AuthRoutes from "./routes/authRoutes";
import cors from "cors";
import { Server } from "socket.io";
import http from "http";
import { AiController } from "./controllers/Ai.controller";
import jwt from "jsonwebtoken";

const { FRONTEND_URL, PORT } = config;

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
  },
});

(async () => {
  await sequelize.sync({ alter: true });
  console.log("database synced");
})();

app.use(express.json());
app.use(cors({ origin: FRONTEND_URL }));

app.use("/api/todos", TodoRoutes);
app.use("/api/auth", AuthRoutes);

io.use((socket, next) => {
  console.log("Socket middleware - checking auth");
  const token = socket.handshake.auth.token;

  if (!token) {
    console.log("No token provided");
    return next(new Error("Unauthorized"));
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as { id: string };
    socket.data.userId = decoded.id;
    console.log("Token verified, userId:", decoded.id);
    next();
  } catch (err) {
    console.log("Token verification failed:", err);
    next(new Error("Invalid token"));
  }
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id, "userId:", socket.data.userId);

  socket.on("ai:chat", (payload) => {
    console.log("Received ai:chat event");
    AiController.chatWithAI(socket, payload);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
