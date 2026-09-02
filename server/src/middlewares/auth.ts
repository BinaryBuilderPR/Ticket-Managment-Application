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

/**
 * Role-based access control middleware factory.
 *
 * Usage:
 *   router.use(requireAuth, requireRole('ADMIN'));
 *   router.get('/admin-only', requireAuth, requireRole('ADMIN', 'AGENT'), handler);
 */
export const requireRole = (...roles: string[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user as AuthUser | undefined;

    if (!user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required.',
      });
      return;
    }

    const userRole: string = (user as any).role ?? '';

    if (!roles.includes(userRole)) {
      res.status(403).json({
        error: 'Forbidden',
        message: `This action requires one of the following roles: ${roles.join(', ')}.`,
      });
      return;
    }

    next();
  };

/**
 * Convenience alias — restricts access to ADMIN role only.
 * Must be chained after requireAuth:
 *   router.use(requireAuth, requireAdmin);
 */
export const requireAdmin = requireRole('ADMIN');


