import { Request, Response, NextFunction } from 'express';
import { createClerkClient } from '@clerk/backend';
import { AppError } from './errorHandler.js';
import { HTTP_STATUS } from '../config/constants.js';
import { createOrGetUserByClerkId } from '../db/functions/users.js';

// Extend Express Request to include Clerk user ID and database user ID
declare global {
  namespace Express {
    interface Request {
      clerkUserId?: string;
      userId?: number; // Database user ID
    }
  }
}

export async function clerkAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Missing or invalid authorization header');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify the token with Clerk
    const clerkSecretKey = process.env.CLERK_SECRET_KEY;
    if (!clerkSecretKey) {
      throw new Error('CLERK_SECRET_KEY is not set in environment variables');
    }

    const client = createClerkClient({ secretKey: clerkSecretKey });
    
    try {
      console.log('Token received, length:', token.length, 'First 20 chars:', token.substring(0, 20));
      
      // Decode the JWT token to get the user ID
      // Clerk's getToken() returns a JWT that we can decode
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.error('Token is not a JWT, parts length:', parts.length);
        throw new Error('Invalid token format - not a JWT');
      }
      
      // Decode the payload (base64url encoded)
      let payload: any;
      try {
        // Handle base64url encoding (replace - with +, _ with /, and add padding if needed)
        let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) {
          base64 += '=';
        }
        payload = JSON.parse(Buffer.from(base64, 'base64').toString());
        console.log('Decoded payload:', JSON.stringify(payload, null, 2));
      } catch (decodeError: any) {
        console.error('Failed to decode token payload:', decodeError.message);
        throw new Error(`Failed to decode token payload: ${decodeError.message}`);
      }
      
      // Extract user ID from token (Clerk uses 'sub' for subject/user ID)
      const clerkUserId = payload.sub || payload.user_id || payload.userId;
      if (!clerkUserId) {
        console.error('Token payload does not contain user ID. Available keys:', Object.keys(payload));
        throw new Error('Token does not contain user ID');
      }
      
      console.log('Extracted Clerk user ID:', clerkUserId);
      
      // Verify token hasn't expired (optional but recommended)
      if (payload.exp && payload.exp < Date.now() / 1000) {
        console.error('Token expired. Exp:', payload.exp, 'Now:', Date.now() / 1000);
        throw new Error('Token has expired');
      }
      
      // Get user info from Clerk to verify the user exists
      console.log('Fetching user from Clerk...');
      const clerkUser = await client.users.getUser(clerkUserId);
      console.log('Clerk user fetched successfully');
      
      // Get or create user in our database
      const email = clerkUser.emailAddresses[0]?.emailAddress || '';
      const username = clerkUser.username || clerkUser.firstName || `user_${clerkUserId.substring(0, 8)}`;
      
      console.log('Creating/getting database user...');
      let dbUser;
      try {
        dbUser = await createOrGetUserByClerkId(clerkUserId, email, username);
        console.log('Database user ID:', dbUser.id);
      } catch (dbError: any) {
        console.error('Database error:', dbError);
        // If it's a column doesn't exist error, provide helpful message
        if (dbError.message && dbError.message.includes('column') && dbError.message.includes('clerk_id')) {
          throw new Error('Database schema needs to be updated. Please run the schema migration to add clerk_id column.');
        }
        throw dbError;
      }
      
      // Attach both Clerk ID and database user ID to request
      req.clerkUserId = clerkUserId;
      req.userId = dbUser.id;
      
      next();
    } catch (error: any) {
      console.error('Clerk auth error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      throw new AppError(HTTP_STATUS.UNAUTHORIZED, `Invalid or expired token: ${error.message || 'Unknown error'}`);
    }
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      console.error('Auth middleware error:', error);
      next(new AppError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Authentication error'));
    }
  }
}

