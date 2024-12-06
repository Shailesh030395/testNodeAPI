import { prisma } from "../config/conn";

class AuthRepo {
  async fetchUser(email: string) {
    const userRes = await prisma.user.findUnique({
      where: {
        email: email.toLowerCase(),
      },
      include: {
        companyRoles: {
          select: {
            role: {
              select: {
                status: true,
              },
            },
          },
        },
      },
    });

    return userRes;
  }
}

export default new AuthRepo();
