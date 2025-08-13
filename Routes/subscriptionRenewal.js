const express = require('express');
const router = express.Router();
const SubscriptionRenewalService = require('../services/SubscriptionRenewalService');
const { protect, isActive } = require('../middleware/auth');
const { isSuperAdmin } = require('../middleware/permissions');

/**
 * @swagger
 * /api/subscription-renewal/check:
 *   post:
 *     summary: تشغيل فحص شامل للاشتراكات (Superadmin only)
 *     tags: [Subscription Renewal]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: تم تشغيل الفحص بنجاح
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
 *                   example: "تم تشغيل فحص الاشتراكات بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     expired:
 *                       type: object
 *                       properties:
 *                         success:
 *                           type: boolean
 *                         expiredCount:
 *                           type: number
 *                           example: 5
 *                     renewals:
 *                       type: object
 *                       properties:
 *                         success:
 *                           type: boolean
 *                         totalProcessed:
 *                           type: number
 *                           example: 10
 *                         successCount:
 *                           type: number
 *                           example: 8
 *                         failureCount:
 *                           type: number
 *                           example: 2
 *       403:
 *         description: Superadmin access required
 *       500:
 *         description: Server error
 */
router.post('/check', protect, isActive, isSuperAdmin, async (req, res) => {
  try {
    const result = await SubscriptionRenewalService.runSubscriptionCheck();
    
    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'تم تشغيل فحص الاشتراكات بنجاح',
        data: result
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'فشل في تشغيل فحص الاشتراكات',
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Error in subscription renewal check:', error);
    return res.status(500).json({
      success: false,
      message: 'خطأ في الخادم',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/subscription-renewal/expired:
 *   post:
 *     summary: فحص الاشتراكات المنتهية فقط (Superadmin only)
 *     tags: [Subscription Renewal]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: تم فحص الاشتراكات المنتهية بنجاح
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
 *                   example: "تم فحص الاشتراكات المنتهية بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                     expiredCount:
 *                       type: number
 *                       example: 5
 *       403:
 *         description: Superadmin access required
 *       500:
 *         description: Server error
 */
router.post('/expired', protect, isActive, isSuperAdmin, async (req, res) => {
  try {
    const result = await SubscriptionRenewalService.checkExpiredSubscriptions();
    
    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'تم فحص الاشتراكات المنتهية بنجاح',
        data: result
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'فشل في فحص الاشتراكات المنتهية',
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Error in expired subscriptions check:', error);
    return res.status(500).json({
      success: false,
      message: 'خطأ في الخادم',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/subscription-renewal/auto-renew:
 *   post:
 *     summary: فحص التجديد التلقائي فقط (Superadmin only)
 *     tags: [Subscription Renewal]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: تم فحص التجديد التلقائي بنجاح
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
 *                   example: "تم فحص التجديد التلقائي بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                     totalProcessed:
 *                       type: number
 *                       example: 10
 *                     successCount:
 *                       type: number
 *                       example: 8
 *                     failureCount:
 *                       type: number
 *                       example: 2
 *       403:
 *         description: Superadmin access required
 *       500:
 *         description: Server error
 */
router.post('/auto-renew', protect, isActive, isSuperAdmin, async (req, res) => {
  try {
    const result = await SubscriptionRenewalService.checkAutoRenewals();
    
    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'تم فحص التجديد التلقائي بنجاح',
        data: result
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'فشل في فحص التجديد التلقائي',
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Error in auto-renewal check:', error);
    return res.status(500).json({
      success: false,
      message: 'خطأ في الخادم',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/subscription-renewal/test-charge:
 *   post:
 *     summary: اختبار استدعاء API Lahza (Superadmin only)
 *     tags: [Subscription Renewal]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - email
 *               - authorizationCode
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 100
 *                 description: "المبلغ بالشيكل"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "test@example.com"
 *                 description: "البريد الإلكتروني"
 *               authorizationCode:
 *                 type: string
 *                 example: "auth_code_123"
 *                 description: "رمز التفويض"
 *               currency:
 *                 type: string
 *                 example: "ILS"
 *                 description: "العملة (ILS, USD, EUR, etc.)"
 *                 default: "ILS"
 *     responses:
 *       200:
 *         description: تم اختبار API بنجاح
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
 *                   example: "تم اختبار API بنجاح"
 *                 data:
 *                   type: object
 *       403:
 *         description: Superadmin access required
 *       500:
 *         description: Server error
 */
router.post('/test-charge', protect, isActive, isSuperAdmin, async (req, res) => {
  try {
    const { amount, email, authorizationCode } = req.body;

    if (!amount || !email || !authorizationCode) {
      return res.status(400).json({
        success: false,
        message: 'جميع الحقول مطلوبة: amount, email, authorizationCode (currency اختياري)'
      });
    }

         const result = await SubscriptionRenewalService.chargeAuthorization(
       amount,
       email,
       authorizationCode,
       req.body.currency || 'ILS'
     );

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'تم اختبار API بنجاح',
        data: result
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'فشل في اختبار API',
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Error in test charge:', error);
    return res.status(500).json({
      success: false,
      message: 'خطأ في الخادم',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/subscription-renewal/status:
 *   get:
 *     summary: الحصول على حالة خدمة تجديد الاشتراكات (Superadmin only)
 *     tags: [Subscription Renewal]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: تم الحصول على الحالة بنجاح
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
 *                   example: "تم الحصول على الحالة بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     serviceStatus:
 *                       type: string
 *                       example: "running"
 *                     lastCheck:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-01T00:00:00.000Z"
 *                     nextCheck:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-01T01:00:00.000Z"
 *       403:
 *         description: Superadmin access required
 *       500:
 *         description: Server error
 */
router.get('/status', protect, isActive, isSuperAdmin, async (req, res) => {
  try {
    const now = new Date();
    const nextCheck = new Date(now.getTime() + 60 * 60 * 1000); // ساعة من الآن

    return res.status(200).json({
      success: true,
      message: 'تم الحصول على الحالة بنجاح',
      data: {
        serviceStatus: 'running',
        lastCheck: now.toISOString(),
        nextCheck: nextCheck.toISOString(),
        cronJobActive: true,
        apiKeyConfigured: !!SubscriptionRenewalService.lahzaApiKey
      }
    });
  } catch (error) {
    console.error('❌ Error getting service status:', error);
    return res.status(500).json({
      success: false,
      message: 'خطأ في الخادم',
      error: error.message
    });
  }
});

module.exports = router;
