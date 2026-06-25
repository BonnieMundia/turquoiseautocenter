const { onRequest } = require('firebase-functions/v2/https');
const { onObjectFinalized } = require('firebase-functions/v2/storage');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });
const sharp = require('sharp');
const path = require('path');
const os = require('os');
const fs = require('fs');

admin.initializeApp();

const RESEND_API_KEY = defineSecret('RESEND_API_KEY');
const ADMIN_EMAIL = defineSecret('ADMIN_EMAIL');

async function sendEmail(apiKey, payload) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    console.error('Resend API error:', await response.text());
  }
}

// Builds a wa.me link from a local Kenyan or already-international number.
function whatsappLink(phone) {
  const digits = phone.replace(/\D/g, '');
  const normalized = digits.startsWith('0') ? `254${digits.slice(1)}` : digits;
  return `https://wa.me/${normalized}`;
}

// Logs whether the request carried a valid App Check token, without
// blocking the request yet — flip to rejecting once verified safe in prod.
async function checkAppCheck(req) {
  const token = req.header('X-Firebase-AppCheck');
  if (!token) {
    console.log('App Check: no token present');
    return;
  }
  try {
    await admin.appCheck().verifyToken(token);
    console.log('App Check: token valid');
  } catch (error) {
    console.log('App Check: invalid token', error.message);
  }
}

exports.submitEnquiry = onRequest(
  { secrets: [RESEND_API_KEY, ADMIN_EMAIL], region: 'us-central1' },
  (req, res) => {
    cors(req, res, async () => {
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      const { name, email, phone, service, vehicle, details } = req.body || {};

      if (!name || !phone || !service) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      await checkAppCheck(req);

      try {
        await admin.firestore().collection('enquiries').add({
          name,
          email: email || null,
          phone,
          service,
          vehicle: vehicle || null,
          details: details || null,
          created_at: admin.firestore.Timestamp.now(),
          status: 'pending',
        });
      } catch (error) {
        console.error('Firestore error:', error);
        return res.status(500).json({ error: 'Failed to store enquiry' });
      }

      const apiKey = RESEND_API_KEY.value();
      const adminEmail = ADMIN_EMAIL.value() || 'admin@turquoiseautocentre.co.ke';

      await sendEmail(apiKey, {
        from: 'Turquoise Auto Centre <noreply@turquoiseautocentre.co.ke>',
        to: [adminEmail],
        subject: 'New Service Enquiry',
        html: `
          <h2>New Service Enquiry Received</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email || 'Not provided'}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          <p><strong>Service:</strong> ${service}</p>
          <p><strong>Vehicle:</strong> ${vehicle || 'Not specified'}</p>
          <p><strong>Details:</strong></p>
          <p>${details || 'No additional details'}</p>
          <p><a href="${whatsappLink(phone)}">Message ${name} on WhatsApp</a></p>
          <hr>
          <p>This enquiry has been stored in the database.</p>
        `,
      });

      if (email) {
        await sendEmail(apiKey, {
          from: 'Turquoise Auto Centre <noreply@turquoiseautocentre.co.ke>',
          to: [email],
          subject: 'Thank you for your enquiry - Turquoise Auto Centre',
          html: `
            <h2>Thank you for contacting Turquoise Auto Centre Ltd!</h2>
            <p>Dear ${name},</p>
            <p>We have received your service enquiry for: <strong>${service}</strong></p>
            <p>Our team will contact you shortly at ${phone} to discuss your requirements and schedule your service.</p>
            <p><strong>Service Details:</strong></p>
            <ul>
              <li><strong>Service:</strong> ${service}</li>
              <li><strong>Vehicle:</strong> ${vehicle || 'Not specified'}</li>
              <li><strong>Additional Details:</strong> ${details || 'None provided'}</li>
            </ul>
            <p>If you have any urgent questions, please call us at +254 116 967804.</p>
            <p>Best regards,<br>Turquoise Auto Centre Ltd<br>Juja, Kiambu County</p>
          `,
        });
      }

      return res.status(200).json({ success: true, message: 'Enquiry submitted successfully' });
    });
  }
);

// Generates a ~400px-wide thumbnail for any image uploaded under
// post-images/ by the admin panel, mirrored at post-images/thumbnails/.
exports.generateThumbnail = onObjectFinalized({ region: 'us-east1' }, async (event) => {
  const filePath = event.data.name;
  const contentType = event.data.contentType || '';

  if (!filePath.startsWith('post-images/') || filePath.startsWith('post-images/thumbnails/')) {
    return;
  }
  if (!contentType.startsWith('image/')) {
    return;
  }

  const bucket = admin.storage().bucket(event.data.bucket);
  const fileName = path.basename(filePath);
  const thumbPath = `post-images/thumbnails/${fileName}`;
  const tempLocalPath = path.join(os.tmpdir(), fileName);
  const tempThumbPath = path.join(os.tmpdir(), `thumb-${fileName}`);

  await bucket.file(filePath).download({ destination: tempLocalPath });
  await sharp(tempLocalPath).resize({ width: 400 }).toFile(tempThumbPath);
  await bucket.upload(tempThumbPath, {
    destination: thumbPath,
    metadata: { contentType },
  });

  fs.unlinkSync(tempLocalPath);
  fs.unlinkSync(tempThumbPath);
});
