import { Request, Response } from "express";
import { CreateUserSchema } from "@repo/common/types";
import { prismaClient } from "@repo/db/client";
import bcrypt from "bcryptjs";

export const signup = async (req: Request, res: Response) => {
    try {
    const parseResult = CreateUserSchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({
        message: "Invalid user data",
        errors: parseResult.error.errors
      });
    }

    const { username, email, password } = parseResult.data;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prismaClient.user.create({
      data: {
        name: username,
        email: email,
        password: hashedPassword
      }
    });

    res.status(201).json({
      message: "User created successfully",
      user: { username, email },
      userId: user.id
    });
  } catch (err: any) {
    res.status(500).json({
      message: "Internal server error",
      error: err.message
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prismaClient.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    res.json({
      message: "Login successful",
      userId: user.id
    });
  } catch (err: any) {
    res.status(500).json({
      message: "Internal server error",
      error: err.message
    });
  }
};
