import { hash } from "bcryptjs";

// Use environment variables in production
export const JWT_SECRET = "your-secret-key-change-in-production";

export type UserRole = "user" | "admin";

export type UserInfo = {
  hashedPassword: string;
  role: UserRole;
};

// In-memory user store with hashed passwords
export const USERS = new Map<string, UserInfo>();

// Initial users - passwords will be hashed on server start
const INITIAL_USERS = [
  { username: "mum", password: "test", role: "user" as const },
  { username: "dad", password: "test2", role: "user" as const },
  { username: "xander", password: "test3", role: "user" as const },
  { username: "admin", password: "test4", role: "admin" as const },
];

// Initialize users with hashed passwords
export async function initializeUsers() {
  for (const user of INITIAL_USERS) {
    const hashedPassword = await hash(user.password, 10);
    USERS.set(user.username, {
      hashedPassword,
      role: user.role,
    });
  }
}

// Call initialization
initializeUsers().catch(console.error);
