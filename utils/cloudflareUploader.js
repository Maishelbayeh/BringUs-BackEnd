const AWS = require('aws-sdk');
const path = require('path');

// إعدادات Cloudflare R2
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || '339e91c277eee714bbecefdc897961c9';
const CLOUDFLARE_ACCESS_KEY_ID = process.env.CLOUDFLARE_ACCESS_KEY_ID || '4a5e81afcb749159a306e8cf0ec623ab';
const CLOUDFLARE_SECRET_ACCESS_KEY = process.env.CLOUDFLARE_SECRET_ACCESS_KEY || 'c00200673d7118af99bbaed3f09aca1c7f6f430f878c00b773364f819f09edc1';
const CLOUDFLARE_BUCKET_NAME = process.env.CLOUDFLARE_BUCKET_NAME || 'bringus';

// endpoint الخاص بـ R2
const CLOUDFLARE_ENDPOINT = `https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`;
const CLOUDFLARE_PUBLIC_BASE = 'https://pub-237eec0793554bacb7debfc287be3b32.r2.dev';

// إعداد عميل S3
const s3 = new AWS.S3({
  endpoint: CLOUDFLARE_ENDPOINT,
  accessKeyId: CLOUDFLARE_ACCESS_KEY_ID,
  secretAccessKey: CLOUDFLARE_SECRET_ACCESS_KEY,
  signatureVersion: 'v4',
  region: 'auto',
});

/**
 * رفع ملف إلى Cloudflare R2
 * @param {Buffer} buffer - بيانات الصورة (buffer)
 * @param {string} originalName - اسم الملف الأصلي (للحصول على الامتداد)
 * @param {string} folder - مجلد داخل البكت (اختياري)
 * @returns {Promise<{url: string, key: string}>}
 */
async function uploadToCloudflare(buffer, originalName, folder = '') {
  const ext = path.extname(originalName);
  const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
  const key = folder ? `${folder}/${fileName}` : fileName;

  const params = {
    Bucket: CLOUDFLARE_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: getContentType(ext),
    ACL: 'public-read',
  };

  await s3.putObject(params).promise();

  // رابط الصورة
  const url = `${CLOUDFLARE_PUBLIC_BASE}/${key}`;
  return { url, key };
}

// دالة بسيطة لتحديد نوع المحتوى
function getContentType(ext) {
  switch (ext.toLowerCase()) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.gif':
      return 'image/gif';
    case '.webp':
      return 'image/webp';
    default:
      return 'application/octet-stream';
  }
}

module.exports = {
  uploadToCloudflare,
}; 