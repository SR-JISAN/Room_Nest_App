import type { Application, Request, Response } from "express";
import express from "express";
import cors from "cors";
import config from "./app/config";
import httpStatus from "http-status";
import { globalErrorHandler } from "./app/middleware/global.error";
import cookieParser from "cookie-parser";
import { notFound } from "./app/middleware/not.found";

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

app.get("/", async (req: Request, res: Response) => {
  res.status(httpStatus.OK).json({
    success: true,
    message: "Welcome to Room Nest App",
  });
});

app.use(globalErrorHandler);
app.use(notFound)

export default app;
