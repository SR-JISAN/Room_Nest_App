
import type { JwtPayload, SignOptions } from "jsonwebtoken"
import jwt from "jsonwebtoken"

const createToken = (
    payload: JwtPayload,
    secrete : string,
    expiresIn : SignOptions
)=>{

    const token = jwt.sign(payload,secrete,{
        expiresIn
    } as SignOptions);
  return token;
};

const verifyToken = (token:string , secrete: string)=>{
    try {
        const verifiedToken = jwt.verify(token,secrete);
        return {
            success : true,
            data: verifiedToken
        };
    } catch (error : any) {
        console.log("Token verification failed:",error);
        return{
            success: false,
            error: error.message
        };
    }
}

export const JwtUtils ={
    createToken,
    verifyToken
}