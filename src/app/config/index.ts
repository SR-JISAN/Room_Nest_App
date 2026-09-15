import dotenv from "dotenv"
import path from "path"


dotenv.config({
    path: path.join(process.cwd(),".env")
})

export default {
  node_env: process.env.NODE_ENV,
  port: process.env.PORT,
  frontend_url: process.env.FRONTEND_URL,
  backend_url: process.env.APP_URL,
  bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS,
  jwt_access_secret: process.env.JWT_ACCESS_SECRET!,
  jwt_refresh_secret: process.env.JWT_REFRESH_SECRET!,
  jwt_access_expires_in: process.env.JWT_ACCESS_EXPIRES_IN!,
  jwt_refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN!,
  admin_name: process.env.ADMIN_NAME!,
  admin_email: process.env.ADMIN_EMAIL!,
  admin_password: process.env.ADMIN_PASSWORD!,
  landlord_name: process.env.LANDLORD_NAME!,
  landlord_email: process.env.LANDLORD_EMAIL!,
  landlord_password: process.env.LANDLORD_PASSWORD!,
  redis_user_name: process.env.REDIS_USERNAME!,
  redis_password: process.env.REDIS_PASSWORD!,
  redis_host: process.env.REDIS_HOST!,
  redis_port: process.env.REDIS_PORT!,
  smtp_user: process.env.SMTP_USER!,
  smtp_password: process.env.SMTP_PASSWORD!,
  sender_email: process.env.SENDER_EMAIL!,
  client_id: process.env.CLIENT_ID!,
  client_secret: process.env.CLIENT_SECRET!,
};