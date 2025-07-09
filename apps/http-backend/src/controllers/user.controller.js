import { CreateUserSchema } from "@repo/common/types";
export const signup = (req, res) => {
  CreateUserSchema.parse(req);
  const { username, email, password } = req.body;
  // Here you would typically hash the password and save the user to the database
  res
    .status(201)
    .json({ message: "User created successfully", user: { username, email } });
};
