import { JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload & {
        id_usuario: number;
        id_rol: number;
      };
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user: JwtPayload & {
    id_usuario: number;
    id_rol: number;
  };
}
