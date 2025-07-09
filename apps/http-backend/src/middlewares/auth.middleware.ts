import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/common/config";

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token)
    return res.sendStatus(401).json({ success: false, error: "Unauthorized" }); // Unauthorized

  const decoded = jwt.verify(token, JWT_SECRET);
  req.user = decoded;
  if (!decoded || !req.user) {
    return res.status(401).json({ success: false, error: "Invalid token" }); // Invalid token
  }
  next();
}
