import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface JwtPayloadUser {
  id: number;
  nama: string;
  email: string;
  role: 'ADMIN' | 'CAMABA';
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayloadUser;
}

const JWT_SECRET = process.env.JWT_SECRET || 'secret_fallback_key';

export const verifyToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'Akses ditolak. Token tidak ditemukan atau format tidak valid (Gunakan Bearer <token>).',
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayloadUser;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({
      success: false,
      message: 'Token tidak valid atau sudah kedaluwarsa.',
    });
    return;
  }
};

export const requireRole = (role: 'ADMIN' | 'CAMABA') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user || req.user.role !== role) {
      res.status(403).json({
        success: false,
        message: `Akses terlarang. Endpoint ini hanya untuk role ${role}.`,
      });
      return;
    }
    next();
  };
};

// Middleware verifikasi role ADMIN secara ketat (harus ada Bearer token valid dan role ADMIN)
export const verifyAdmin = [verifyToken, requireRole('ADMIN')];

// Middleware verifikasi role ADMIN fleksibel:
// Jika terdapat Authorization header, wajib valid dan role ADMIN.
// Jika tidak ada header, tetap diizinkan untuk kemudahan preview & testing dashboard.
export const optionalAdminAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  if (
    !authHeader ||
    authHeader.trim() === '' ||
    authHeader === 'undefined' ||
    authHeader === 'null' ||
    authHeader === 'Bearer' ||
    authHeader === 'Bearer undefined' ||
    authHeader === 'Bearer null'
  ) {
    return next();
  }

  if (!authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'Format token tidak valid. Gunakan format Bearer <token>.',
    });
    return;
  }

  const token = authHeader.split(' ')[1]?.trim();
  if (!token || token === 'undefined' || token === 'null') {
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayloadUser;
    req.user = decoded;
    if (req.user.role !== 'ADMIN') {
      res.status(403).json({
        success: false,
        message: 'Akses terlarang. Endpoint ini hanya untuk role ADMIN.',
      });
      return;
    }
    next();
  } catch (error) {
    res.status(403).json({
      success: false,
      message: 'Token tidak valid atau sudah kedaluwarsa.',
    });
    return;
  }
};


