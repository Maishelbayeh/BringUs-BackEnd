const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const UserController = require('../Controllers/UserController');

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      messageAr: 'خطأ في التحقق من البيانات',
      errors: errors.array()
    });
  }
  next();
};

/**
 * @swagger
 * /api/email-verification/send:
 *   post:
 *     summary: Send email verification OTP
 *     description: Send a 5-digit OTP to user's email for verification
 *     tags: [Email Verification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - storeSlug
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *                 example: "user@example.com"
 *               storeSlug:
 *                 type: string
 *                 description: Store slug for personalized email (required)
 *                 example: "my-store"
 *     responses:
 *       200:
 *         description: Verification code sent successfully
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
 *                   example: "Verification code sent successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                       example: "user@example.com"
 *                     expiresIn:
 *                       type: string
 *                       example: "1 minute"
 *       400:
 *         description: Bad request - validation errors
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.post('/send', [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
  body('storeSlug')
    .notEmpty()
    .withMessage('Store slug is required')
    .isString()
    .withMessage('Store slug must be a string')
], UserController.sendEmailVerification);

/**
 * @swagger
 * /api/email-verification/verify:
 *   post:
 *     summary: Verify email with OTP
 *     description: Verify user's email using the 5-digit OTP
 *     tags: [Email Verification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *                 example: "user@example.com"
 *               otp:
 *                 type: string
 *                 pattern: "^[0-9]{5}$"
 *                 description: 5-digit verification code
 *                 example: "12345"
 *     responses:
 *       200:
 *         description: Email verified successfully
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
 *                   example: "Email verified successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                       example: "user@example.com"
 *                     isEmailVerified:
 *                       type: boolean
 *                       example: true
 *                     emailVerifiedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-15T10:30:00.000Z"
 *       400:
 *         description: Bad request - validation errors or invalid OTP
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.post('/verify', [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
  body('otp')
    .isLength({ min: 5, max: 5 })
    .withMessage('OTP must be exactly 5 digits')
    .isNumeric()
    .withMessage('OTP must contain only numbers')
], UserController.verifyEmail);

/**
 * @swagger
 * /api/email-verification/resend:
 *   post:
 *     summary: Resend email verification OTP
 *     description: Resend a new 5-digit OTP to user's email
 *     tags: [Email Verification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - storeSlug
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *                 example: "user@example.com"
 *               storeSlug:
 *                 type: string
 *                 description: Store slug for personalized email (required)
 *                 example: "my-store"
 *     responses:
 *       200:
 *         description: New verification code sent successfully
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
 *                   example: "New verification code sent successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                       example: "user@example.com"
 *                     expiresIn:
 *                       type: string
 *                       example: "1 minute"
 *       400:
 *         description: Bad request - validation errors or too frequent requests
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.post('/resend', [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
  body('storeSlug')
    .notEmpty()
    .withMessage('Store slug is required')
    .isString()
    .withMessage('Store slug must be a string')
], UserController.resendEmailVerification);

/**
 * @swagger
 * /api/email-verification/status:
 *   post:
 *     summary: Check email verification status
 *     description: Check if user's email is verified and get verification status details
 *     tags: [Email Verification]
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
 *     responses:
 *       200:
 *         description: Email verification status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                       example: "user@example.com"
 *                     isEmailVerified:
 *                       type: boolean
 *                       example: true
 *                     emailVerifiedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-15T10:30:00.000Z"
 *                     hasPendingVerification:
 *                       type: boolean
 *                       example: false
 *                     otpExpired:
 *                       type: boolean
 *                       example: false
 *                     status:
 *                       type: string
 *                       enum: [verified, pending, not_verified]
 *                       example: "verified"
 *       400:
 *         description: Bad request - validation errors
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.post('/status', [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail()
], UserController.checkEmailVerificationStatus);

/**
 * @swagger
 * /api/email-change/request:
 *   post:
 *     summary: Request email change by userId (no auth required)
 *     description: Request to change user email - sends OTP to new email. Use this before login.
 *     tags: [Email Change]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - newEmail
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User ID
 *                 example: "68de4e4e9d281851c29f1fc6"
 *               newEmail:
 *                 type: string
 *                 format: email
 *                 description: New email address
 *                 example: "newemail@example.com"
 *     responses:
 *       200:
 *         description: Verification code sent to new email
 *       400:
 *         description: Bad request - validation errors
 *       404:
 *         description: User not found
 *       409:
 *         description: Email already in use
 *       500:
 *         description: Internal server error
 */
const emailChangeValidation = [
  body('userId')
    .notEmpty()
    .withMessage('User ID is required'),
  body('newEmail')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail()
];

// Support both POST and PATCH
router.post('/request', emailChangeValidation, validate, UserController.requestEmailChangeByUserId);
router.patch('/request', emailChangeValidation, validate, UserController.requestEmailChangeByUserId);

/**
 * @swagger
 * /api/email-change/verify:
 *   post:
 *     summary: Verify email change by userId (no auth required)
 *     description: Verify new email with OTP and complete email change. Use this before login.
 *     tags: [Email Change]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - otp
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User ID
 *                 example: "68de4e4e9d281851c29f1fc6"
 *               otp:
 *                 type: string
 *                 pattern: "^[0-9]{5}$"
 *                 description: 5-digit verification code
 *                 example: "12345"
 *     responses:
 *       200:
 *         description: Email changed successfully
 *       400:
 *         description: Bad request - invalid or expired OTP
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.post('/verify', [
  body('userId')
    .notEmpty()
    .withMessage('User ID is required'),
  body('otp')
    .isLength({ min: 5, max: 5 })
    .withMessage('OTP must be exactly 5 digits')
    .isNumeric()
    .withMessage('OTP must contain only numbers')
], validate, UserController.verifyEmailChangeByUserId);

module.exports = router;

