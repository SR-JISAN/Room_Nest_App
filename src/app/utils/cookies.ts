import type{ CookieOptions } from "express";
import config from "../config";

export const accessTokenCookies: CookieOptions = {
  httpOnly: true,
  secure: config.node_env === "production",
  sameSite: config.node_env === "production" ? "none":"lax",
  maxAge: 1000*60*60,
  path:"/"
};
export const refreshTokenCookies: CookieOptions = {
  httpOnly: true,
  secure: config.node_env === "production",
  sameSite: config.node_env === "production" ? "none":"lax",
  maxAge: 1000*60*60*24*30,
  path:"/"
};