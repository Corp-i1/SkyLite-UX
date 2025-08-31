import { compare } from "bcryptjs";
import { createError, defineEventHandler, readBody } from "h3";

import { USERS } from "../../utils";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { username, password } = body;

  const user = USERS.get(username);
  if (!user || user.role !== "admin") {
    throw createError({
      statusCode: 401,
      message: "Unauthorized",
    });
  }

  const validPassword = await compare(password, user.hashedPassword);
  if (!validPassword) {
    throw createError({
      statusCode: 401,
      message: "Invalid credentials",
    });
  }

  return { success: true };
});
