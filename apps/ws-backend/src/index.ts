import { WebSocket, WebSocketServer } from 'ws';
import jwt from "jsonwebtoken";
import { JWT_SECRET } from '@repo/backend-common/config';
import { prismaClient } from "@repo/db/client";

const wss = new WebSocketServer({ port: 8080 });

interface User {
  ws: WebSocket;
  rooms: Set<string>;
  userId: string;
}

const users = new Map<WebSocket, User>();

function getUserIdFromToken(token: string): string | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
    return typeof decoded === "object" && decoded.userId ? decoded.userId : null;
  } catch {
    return null;
  }
}

function parseMessage(data: WebSocket.RawData): any | null {
  try {
    return JSON.parse(typeof data === "string" ? data : data.toString());
  } catch {
    return null;
  }
}

function normalizeRoomId(roomId: unknown): string | null {
  if (typeof roomId === "string" || typeof roomId === "number") {
    return String(roomId);
  }
  return null;
}

wss.on('connection', (ws, request) => {
  const url = request.url;
  if (!url) {
    ws.close();
    return;
  }
  const queryParams = new URLSearchParams(url.split('?')[1]);
  const token = queryParams.get('token') || "";
  const userId = getUserIdFromToken(token);

  if (!userId) {
    ws.close();
    return;
  }

  const user: User = { ws, rooms: new Set(), userId };
  users.set(ws, user);

  ws.on('message', async (data) => {
    const parsedData = parseMessage(data);
    if (!parsedData || typeof parsedData.type !== "string") return;

    switch (parsedData.type) {
      case "join_room": {
        const roomId = normalizeRoomId(parsedData.roomId);
        if (roomId) user.rooms.add(roomId);
        break;
      }
      case "leave_room": {
        const roomId = normalizeRoomId(parsedData.roomId);
        if (roomId) user.rooms.delete(roomId);
        break;
      }
      case "chat": {
        const roomId = normalizeRoomId(parsedData.roomId);
        const message = parsedData.message;
        if (!roomId || typeof message !== "string") break;
        try {
          await prismaClient.chat.create({
            data: {
              roomId: Number(roomId),
              message,
              userId: user.userId
            }
          });
        } catch {
          break;
        }
        for (const u of users.values()) {
          if (u.rooms.has(roomId)) {
            u.ws.send(JSON.stringify({
              type: "chat",
              message,
              roomId
            }));
          }
        }
        break;
      }
      default:
        break;
    }
  });

  ws.on('close', () => {
    users.delete(ws);
  });
});
