import type{ CookieOptions } from "express";
import config from "../config";

export const accessTokenCookies: CookieOptions = {
  httpOnly: true,
  secure: config.node_env === "development" ? false : true,
  sameSite: config.node_env === "development" ? "lax" : "none",
  maxAge: 1000 * 60 * 60 *24,
  path: "/",
};
export const refreshTokenCookies: CookieOptions = {
  httpOnly: true,
  secure: config.node_env === "development" ? false : true,
  sameSite: config.node_env === "development" ? "lax" : "none",
  maxAge: 1000 * 60 * 60 * 24 * 7,
  path: "/"
};