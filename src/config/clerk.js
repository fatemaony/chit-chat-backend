import { clerkMiddleware, clerkClient, getAuth } from '@clerk/express';
import { UnauthorizedError } from '../lib/errors.js';
export { clerkMiddleware, clerkClient, getAuth };
export function requireAuthApi(req, _res, next) {
    const auth = getAuth(req);
    if (!auth.userId) {
        return next(new UnauthorizedError('You must be signed in to access'));
    }
    return next();
}
