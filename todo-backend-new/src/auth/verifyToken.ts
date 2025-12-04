import jwt from 'jsonwebtoken';
import { config } from '../config';


const {JWT_SECRET}= config;


export interface JWTPayload{
    userId: string | null;
    email: string | null
}


export function verifyToken(token: string): JWTPayload | null{
    try{
        const cleanToken = token.replace("Bearer ", "");
        const decoded = jwt.verify(cleanToken, JWT_SECRET) as JWTPayload;
        return decoded;
    }catch(err:any){
        console.log("token verification failed: ", err);
        return null;
    }
}