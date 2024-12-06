import envConfig from "../../envConfig";
import { prisma } from "../config/conn";
import { CustomError } from "../helper/customError";
import sendEmail from "../helper/emailHelper";
import { getInvitationEmailUserTemplate } from "../helper/emailTemplateHelper";
import { generateAccessToken } from "../helper/tokenHelper";
import userRepo from "../repositories/userRepo";

class UserService {
  async getUser(id: number) {
    const findUserRes = await userRepo.fetchUserById(id);
    if (!findUserRes) {
      throw new CustomError(404, "An error occured while fetching user");
    }
    return findUserRes;
  }

  async getAllUsers(
    id: number,
    company: string,
    page: number,
    limit: number,
    search?: string,
    filter?: string,
    type?: string,
    sort?: string
  ) {
    // Calculate the offset based on the page and limit
    const offset = (Number(page) - 1) * Number(limit);

    // Define filter conditions based on the 'filter' parameter
    const filterConditions: Record<string, any> = filter
      ? { status: filter == "true" }
      : {};

    // Define search conditions based on the 'search' parameter
    const searchCondition = search
      ? {
          OR: [
            {
              firstName: {
                mode: "insensitive",
                contains: search,
              },
            },
            {
              lastName: {
                mode: "insensitive",
                contains: search,
              },
            },
            {
              email: { contains: search, mode: "insensitive" },
            },
          ],
        }
      : {};

    // Define sorting conditions based on the 'sort' and 'type' parameters
    const sortCondition = sort
      ? {
          orderBy: {
            [sort]: type ?? "asc",
          },
        }
      : {};

    // Get all users with applied filters, search, and sorting
    const users = await userRepo.getAll(
      company,
      offset,
      limit,
      filterConditions,
      searchCondition,
      sortCondition
    );

    // Get the total count of users based on the applied filters and search
    const total = await userRepo.count(
      company,
      filterConditions,
      searchCondition
    );

    return { users, total };
  }

  // Get user by id
  async getUserById(id: string) {
    const user = await userRepo.getById(id);
    return user;
  }

  async updateUser(dataToupdateUser: any) {
    const { firstName, lastName, status, roleId, companyId, userId, phone } =
      dataToupdateUser;
    const currentRole = await prisma.companyRole.findUnique({
      where: {
        companyId_userId: {
          userId: Number(userId),
          companyId,
        },
      },
      select: {
        role: true,
      },
    });

    // Check if the role status is false and the requested user status is true
    if (currentRole?.role.status === false && status === true) {
      throw new CustomError(
        403,
        "Cannot set user status to true when the associated role status is false"
      );
    }

    await prisma.user.update({
      where: {
        id: Number(userId),
      },
      data: {
        firstName: firstName,
        lastName,
        status,
        phone,
      },
    });

    if (roleId) {
      await prisma.companyRole.update({
        where: {
          companyId_userId: {
            userId: userId,
            companyId: companyId,
          },
        },
        data: {
          roleId: roleId,
        },
      });
    }

    const updatedUser = await prisma.companyRole.findUnique({
      where: {
        companyId_userId: {
          userId: Number(userId),
          companyId,
        },
      },
      select: {
        role: true,
        user: true,
      },
    });

    return updatedUser;
  }

  async inviteUser(
    id: number,
    email: string,
    roleId: string,
    company: string,
    phone: string,
    firstName: string,
    lastName: string
  ) {
    // Check if user already exists
    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) {
      throw new CustomError(400, "User already exists");
    }

    // Check if role exists
    const roleExists = await prisma.role.findUnique({ where: { id: roleId } });
    if (!roleExists) {
      throw new CustomError(404, "Role does not exist");
    }

    const accessToken = await generateAccessToken({ email });

    // Get company name first
    const companyName = await prisma.connections.findUnique({
      where: {
        companyId: envConfig.companyId,
      },
    });

    // Prepare and send email first
    const url = `${envConfig.reactAppBaseUrl}/reset-password?token=${accessToken}&first=true&setPassword=true`;
    const emailContent = getInvitationEmailUserTemplate({
      email,
      companyName: companyName?.companyName,
      url,
    });

    const mailOptions = {
      from: envConfig.smtpEmail,
      to: email,
      subject: "Invitation to join 3nStar",
      html: emailContent,
    };

    try {
      // Try to send email first
      const sendEmailRes = await sendEmail(mailOptions);
      // If email is sent successfully, create the user
      if (sendEmailRes) {
        const createdUser = await prisma.user.create({
          data: {
            email,
            status: false,
            phone,
            firstName,
            lastName,
            createdBy: id,
          },
        });

        // Create or update company role
        const companyRole = await prisma.companyRole.upsert({
          where: {
            companyId_userId: {
              companyId: envConfig.companyId,
              userId: createdUser.id,
            },
          },
          update: {
            roleId,
          },
          create: {
            companyId: envConfig.companyId,
            userId: createdUser.id,
            roleId,
            status: true,
          },
          include: {
            role: true,
            user: true,
          },
        });

        return companyRole;
      } else {
        return [];
      }
    } catch (error) {
      console.log("error", error);
      throw new CustomError(500, "Failed to send invitation email");
    }
  }

  async deleteUser(userId: number, companyId: string) {
    // Find User
    const getUserRes = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    // If user not found, send a 404 Not Found error
    if (!getUserRes) {
      const error = new CustomError(404, "User not found"); // 404 Not Found
      throw error;
    }

    // Check if user exists in the company
    const userExist = await prisma.companyRole.findUnique({
      where: {
        companyId_userId: {
          companyId: envConfig.companyId,
          userId: getUserRes.id,
        },
      },
    });

    // If user does not exist in the company, send a 404 Not Found error
    if (!userExist) {
      const error = new CustomError(404, "User does not exist in this company"); // 404 Not Found
      throw error;
    }

    await prisma.companyRole.delete({
      where: {
        companyId_userId: {
          companyId: envConfig.companyId,
          userId: getUserRes.id,
        },
      },
    });

    const deleteUser = await prisma.user.delete({
      where: {
        id: getUserRes.id,
      },
    });

    return deleteUser;
  }
}

export default new UserService();
