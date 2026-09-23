import type { Application, Request, Response } from "express";
import express from "express";
import cors from "cors";
import config from "./app/config";
import httpStatus from "http-status";
import { globalErrorHandler } from "./app/middleware/global.error";
import cookieParser from "cookie-parser";
import { notFound } from "./app/middleware/not.found";
import { AuthRoute } from "./app/model/auth/auth.route";
import { UserRouter } from "./app/model/users/user.route";
import { AmenitiesRouter } from "./app/model/amenities/amenities.route";
import { PropertyRoute } from "./app/model/properties/properties.route";
import { BookingRoute } from "./app/model/booking/booking.route";

const app: Application = express();

app.use(
  cors({
    origin: config.frontend_url,
    credentials: true,
  }),
);

app.use(express.urlencoded({ extended: true }));

app.use(express.json());
app.use(cookieParser());

//all api routes 

app.use("/api/auth", AuthRoute);
app.use("/api/users", UserRouter);

app.use("/api/amenities",AmenitiesRouter);
app.use("/api/properties",PropertyRoute);

app.use("/api/booking",BookingRoute);





//main routes
app.get("/", async (req: Request, res: Response) => {
  res.status(httpStatus.OK).json({
    success: true,
    message: "Welcome to Room Nest App",
  });
});

app.use(globalErrorHandler);
app.use(notFound)

export default app;
