const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const UserController = require('../Controllers/UserController');

/**
 * @swagger
 * /api/password-reset/forgot:
 *   post:
 *     summary: Send forgot password email
 *     description: Send a password reset email with a secure token to user's email
 *     tags: [Password Reset]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *                 example: "user@example.com"
 *               storeSlug:
 *                 type: string
 *                 description: Store slug for personalized email (optional)
 *                 example: "my-store"
 *               baseUrl:
 *                 type: string
 *                 description: Frontend base URL for reset link (optional)
 *                 example: "https://myapp.com"
 *     responses:
 *       200:
 *         description: Password reset email sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Password reset email sent successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                       example: "user@example.com"
 *                     expiresIn:
 *                       type: string
 *                       example: "10 minutes"
 *       400:
 *         description: Bad request - validation errors
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.post('/forgot', [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
  body('storeSlug')
    .optional()
    .isString()
    .withMessage('Store slug must be a string'),
  body('baseUrl')
    .optional()
    .isURL()
    .withMessage('Base URL must be a valid URL')
], UserController.forgotPassword);

/**
 * @swagger
 * /api/password-reset/reset:
 *   post:
 *     summary: Reset password using token
 *     description: Reset user's password using the token from the email
 *     tags: [Password Reset]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *                 description: Reset token from the email
 *                 example: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0"
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 description: New password (minimum 6 characters)
 *                 example: "newpassword123"
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Password reset successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                       example: "user@example.com"
 *       400:
 *         description: Bad request - validation errors or invalid/expired token
 *       500:
 *         description: Internal server error
 */
router.post('/reset', [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required')
    .isString()
    .withMessage('Reset token must be a string'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .isString()
    .withMessage('Password must be a string')
], UserController.resetPassword);

module.exports = router;
