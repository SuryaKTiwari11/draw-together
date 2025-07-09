import { WebSocketServer } from "ws";
import jwt, { JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
const wss = new WebSocketServer({ port: 8080 });
const key = process.env.JWT_SECRET;
wss.on("connection", function connection(ws, request) {
  const url = request.url;
  if (!url) {
    return;
  }

  const queryParams = new URLSearchParams(url.split("?")[1]);
  const token = queryParams.get("token") || "";
  const decoded = jwt.verify(token, key);
  if (!decoded || !(decoded as JwtPayload).userId) {
    ws.close(1008, "Invalid token");
    return;
  }

  ws.on("message", function message(data) {
    ws.send(`Received: ${data}`);
  });
});
