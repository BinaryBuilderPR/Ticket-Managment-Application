import { Request, Response, NextFunction } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../config/auth.js';

export type AuthUser = typeof auth.$Infer.Session.user;
export type AuthSession = typeof auth.$Infer.Session.session;

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
  authSession?: AuthSession;
}

/**
 * Express Middleware to protect endpoints and ensure the user is authenticated.
 * Attaches `req.user` and `req.session` to the request object.
 */
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required. Please sign in.',
      });
    }

    (req as any).user = session.user;
    (req as any).session = session.session;
    (req as any).authSession = session.session;
    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired authentication session.',
    });
  }
};

