import { OAuth2Client } from "google-auth-library";
import config from "../config";

export const GoogleClient = new OAuth2Client({
    clientId: config.client_id
})