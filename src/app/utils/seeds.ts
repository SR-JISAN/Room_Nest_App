import bcrypt from "bcryptjs"
import { Role } from "../../generated/prisma/enums"
import config from "../config"
import { prisma } from "../lib/prisma"
import AppError from "./appError"
import httpStatus from "http-status" 


export  const AdminSeed = async ()=>{
    try {
        
        const isExistAdmin = await prisma.users.findFirst({
            where:{
                role:Role.ADMIN
            }
        })

        if (isExistAdmin) {
          console.log("Admin already exists");
          return;
        }

        const name = config.admin_name
        const email =config.admin_email
        const password = config.admin_password

         if (!name || !email || !password) {
           throw new AppError(httpStatus.BAD_REQUEST,"Something is missing name, email or password");
         }

        const hashPassword = await bcrypt.hash(password,Number(config.bcrypt_salt_rounds))

        const createAdmin = await prisma.users.create({
            data:{
                name,
                email,
                password: hashPassword,
                role:Role.ADMIN,
                emailVerified:true,
                needPasswordChange:true,
                profiles:{
                    create:{
                        contactNumber: ""
                    }
                }
            },include:{
                profiles:true
            },omit:{
                password:true
            }
        });

        console.log(createAdmin);
    } catch (error) {
         console.log(error);
         await prisma.users.delete({
           where: {
             email: config.admin_email,
           },
         });
    }
}
export const LandlordSeed = async () => {
  try {
    const isExistLandlord = await prisma.users.findFirst({
      where: {
        role: Role.LANDLORD,
      },
    });

    if (isExistLandlord) {
      console.log("Landlord already exists");
      return;
    }

    const name = config.landlord_name;
    const email = config.landlord_email;
    const password = config.landlord_password;

    if (!name || !email || !password) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Something is missing name, email or password",
      );
    }

    const hashPassword = await bcrypt.hash(
      password,
      Number(config.bcrypt_salt_rounds),
    );

    const createLandlord = await prisma.users.create({
      data: {
        name,
        email,
        password: hashPassword,
        role: Role.LANDLORD,
        emailVerified: true,
        needPasswordChange: true,
        profiles: {
          create: {
            contactNumber: "",
          },
        },
      },
      include: {
        profiles: true,
      },
      omit: {
        password: true,
      },
    });

    console.log(createLandlord);
  } catch (error) {
    console.log(error);
    await prisma.users.delete({
      where: {
        email: config.landlord_email,
      },
    });
  }
};



