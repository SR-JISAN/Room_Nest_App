import type { CookieOptions } from "express";
import config from "../config";

const baseCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: config.node_env === "production",
  sameSite: config.node_env === "production" ? "none" : "lax",
  path: "/",
};

export const accessTokenCookies: CookieOptions = {
  ...baseCookieOptions,
  maxAge: 1000 * 60 * 60 * 24,
};

export const refreshTokenCookies: CookieOptions = {
  ...baseCookieOptions,
  maxAge: 1000 * 60 * 60 * 24 * 7,
};