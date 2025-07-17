import { Request, Response } from "express";
import { CreateRoomSchema } from "@repo/backend-common/types";
import { prismaClient } from "@repo/db/client";

// If you have custom properties like userId on req, extend the Request type accordingly
interface AuthenticatedRequest extends Request {
  userId?: string;
}

export const createRoom = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parseResult = CreateRoomSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        message: "Invalid room data",
        errors: parseResult.error.errors,
      });
    }
    const userId = req.userId;
    const room = await prismaClient.room.create({
      data: {
        slug: parseResult.data.name,
        adminId: userId,
      },
    });
    res.status(201).json(room);
  } catch (error) {
    console.error("Error creating room:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const chatRoom = async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;

    const chatMessages = await prismaClient.chat.findMany({
      where: {
        roomId: roomId,
      },
      orderBy: {
        id: "desc",
      },
      take: 1000,
    });
    res.status(200).json(chatMessages);
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const roomSlug = async (req: Request, res: Response) => {
  const { slug } = req.params;
  const room = await prismaClient.room.findFirst({
    where: {
      slug: slug,
    },
  });
  if (!room) {
    return res.status(404).json({ error: "Room not found" });
  }
  res.status(200).json(room);
};
