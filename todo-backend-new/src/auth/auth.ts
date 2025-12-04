import { ExpressContextFunctionArgument } from '@apollo/server/express4';
import { verifyToken } from "./verifyToken";




interface JWTPayload {
  userId: string | null;
  email: string | null;
}

export interface Context {
  user?: JWTPayload | null;
}


export const authToken = {
  context: async ({ req }: ExpressContextFunctionArgument ): Promise<Context> => {
    console.log("token checking");

    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) return {};

      const decoded = verifyToken(authHeader);
    if(!decoded)
      return {}

    console.log("userID: ", decoded.userId);
    return {user: decoded};
    
    }
  };

