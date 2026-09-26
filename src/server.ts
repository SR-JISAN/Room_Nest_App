import app from "./app";
import config from "./app/config";
import { transporter } from "./app/lib/nodemailer";
import { prisma } from "./app/lib/prisma";
import { redisClient } from "./app/lib/redis";
import { AdminSeed, LandlordSeed } from "./app/utils/seeds";



const PORT = config.port;


const main= async()=>{
   try {
    await prisma.$connect();
    ;
    //for test 
    AdminSeed()
    
    LandlordSeed()
    

    //redis connected

    await redisClient.connect()

   

    //nodemailer connected

    await transporter.verify()
    


    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
   } catch (error) {
    console.error("Error starting the server:", error);
    await prisma.$disconnect()
    process.exit(1)
   }
}

main()