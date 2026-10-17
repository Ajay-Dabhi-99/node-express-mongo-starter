import type { Request, Response } from 'express';
import { sendNoContent, sendSuccess } from '@/core/utils/api-response';
import { getAuthContext } from './auth.middleware';
import type { LoginInput, RefreshTokenInput } from './auth.schema';
import { authService } from './auth.service';
import type { RequestMeta } from './auth.types';

const requestMeta = (req: Request): RequestMeta => ({
  ip: req.ip,
  userAgent: req.get('user-agent'),
});

export const authController = {
  async login(req: Request, res: Response) {
    const { email, password } = req.body as LoginInput;
    sendSuccess(res, await authService.login(email, password, requestMeta(req)));
  },

  async refresh(req: Request, res: Response) {
    const { refreshToken } = req.body as RefreshTokenInput;
    const tokens = await authService.refresh(refreshToken, requestMeta(req));
    sendSuccess(res, { tokens });
  },

  async logout(req: Request, res: Response) {
    const { refreshToken } = req.body as RefreshTokenInput;
    await authService.logout(refreshToken);
    sendNoContent(res);
  },

  async me(req: Request, res: Response) {
    const { userId } = getAuthContext(req);
    sendSuccess(res, await authService.getCurrentUser(userId));
  },
};
