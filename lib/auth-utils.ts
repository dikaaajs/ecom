import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { prisma } from "./prisma";

// create admin users
export async function createAdminUser(username: string, password: string) {
  try {
    // Check if user already exists
    const existingUser = await prisma.adminUser.findUnique({
      where: { username },
    });

    if (existingUser) {
      throw new Error("Admin user already exists");
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create the admin user
    const adminUser = await prisma.adminUser.create({
      data: {
        username,
        password: hashedPassword,
        role: "admin",
      },
    });

    return {
      id: adminUser.id,
      username: adminUser.username,
      role: adminUser.role,
    };
  } catch (error) {
    console.error("Error creating admin user:", error);
    throw error;
  }
}

// verify password
export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string,
) {
  return bcrypt.compare(plainPassword, hashedPassword);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}
// export as
// ync function requireAdminAuth() {
//   const session = await getServerSession(authOptions)

//   if (!session || session.user.role !== 'admin') {
//     throw new Error('Unauthorized: Admin access required')
//   }

//   return session
// }

export function createErrorResponse(
  error: string,
  message: string,
  status: number,
) {
  return {
    error,
    message,
    statusCode: status,
    timestamp: new Date().toISOString(),
  };
}
