/**
 * Partner Auth Routes
 * Token endpoint for OAuth2 Client Credentials flow.
 * POST /api/v1/partner/auth/token
 */

import { Router } from 'express';
import { generatePartnerToken } from '../../middleware/partnerAuth.js';

const router = Router();

// ─── POST /token — OAuth2 Client Credentials Token Exchange ────────────────────
router.post('/token', async (req, res) => {
  try {
    const { client_id, client_secret, grant_type } = req.body;

    if (grant_type !== 'client_credentials') {
      return res.status(400).json({
        error: {
          code: 'UNSUPPORTED_GRANT_TYPE',
          message: 'Only client_credentials grant type is supported',
        }
      });
    }

    if (!client_id || !client_secret) {
      return res.status(400).json({
        error: {
          code: 'MISSING_CREDENTIALS',
          message: 'client_id and client_secret are required',
        }
      });
    }

    const tokenResponse = await generatePartnerToken(client_id, client_secret);
    res.json(tokenResponse);
  } catch (error) {
    console.error('Token generation failed:', error.message);
    res.status(401).json({
      error: {
        code: 'AUTHENTICATION_FAILED',
        message: error.message || 'Invalid credentials',
      }
    });
  }
});

export default router;
