// monjed start  editing

const express = require('express');
const router = express.Router();

const SocialCommentController = require('../Controllers/SocialCommentController');
const protect = require('../middleware/auth');
const permissions = require('../middleware/permissions');

/**
 * @swagger
 * components:
 *   schemas:
 *     SocialComment:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "60f7c0b8b4d1c80015e4d123"
 *         store:
 *           type: string
 *           example: "60f7c0b8b4d1c80015e4d456"
 *         platform:
 *           type: string
 *           enum: [Facebook, Instagram, Twitter, LinkedIn, TikTok]
 *           example: "Instagram"
 *         image:
 *           type: string
 *           example: "https://example.com/image.jpg"
 *         personName:
 *           type: string
 *           example: "Jane Doe"
 *         personTitle:
 *           type: string
 *           example: "Marketing Manager"
 *         comment:
 *           type: string
 *           example: "This is a wonderful service! Highly recommended."
 *         active:
 *           type: boolean
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/social-comments:
 *   get:
 *     summary: Get all social media testimonials for the current store
 *     tags: [SocialComment]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of testimonials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SocialComment'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to fetch testimonials"
 */
router.get(
  '/api/social-comments',
  protect,
  permissions(['owner']),
  SocialCommentController.getSocialComments
);

/**
 * @swagger
 * /api/social-comments:
 *   post:
 *     summary: Create a new social media testimonial
 *     tags: [SocialComment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SocialComment'
 *     responses:
 *       201:
 *         description: Testimonial created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/SocialComment'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Validation error"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to create testimonial"
 */
router.post(
  '/api/social-comments',
  protect,
  permissions(['owner']),
  SocialCommentController.createSocialComment
);

/**
 * @swagger
 * /api/social-comments/{id}:
 *   put:
 *     summary: Update a social media testimonial
 *     tags: [SocialComment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Testimonial ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SocialComment'
 *     responses:
 *       200:
 *         description: Testimonial updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/SocialComment'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Validation error"
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Testimonial not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to update testimonial"
 */
router.put(
  '/api/social-comments/:id',
  protect,
  permissions(['owner']),
  SocialCommentController.updateSocialComment
);

/**
 * @swagger
 * /api/social-comments/{id}:
 *   delete:
 *     summary: Delete a social media testimonial
 *     tags: [SocialComment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Testimonial ID
 *     responses:
 *       200:
 *         description: Testimonial deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/SocialComment'
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Testimonial not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to delete testimonial"
 */
router.delete(
  '/api/social-comments/:id',
  protect,
  permissions(['owner']),
  SocialCommentController.deleteSocialComment
);

module.exports = router;

// monjed end editing 