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

const SITE_URL = 'https://www.turquoiseautocentre.co.ke';

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function siteHeaderFooter(activeIsBlog = true) {
  return {
    header: `
<nav role="navigation" aria-label="Main navigation">
  <a href="/index.html" class="nav-logo" aria-label="Turquoise Auto Centre home">
    <div class="logo-icon" aria-hidden="true">
      <img src="/turquoise-auto-logo.png" alt="Turquoise Auto Centre logo" width="40" height="40" />
    </div>
    <div class="logo-text">
      <strong>TURQUOISE AUTO</strong>
      <span>Centre Ltd</span>
    </div>
  </a>
  <ul class="nav-links" role="list">
    <li><a href="/index.html">Home</a></li>
    <li><a href="/services.html">Services</a></li>
    <li><a href="/pricing.html">Pricing</a></li>
    <li><a href="/faq.html">FAQ</a></li>
    <li><a href="/about.html">About</a></li>
    <li><a href="/gallery.html">Gallery</a></li>
    <li><a href="/blog.html"${activeIsBlog ? ' class="active"' : ''}>Blog</a></li>
    <li><a href="/contact.html" class="nav-cta">Contact Us</a></li>
  </ul>
</nav>`,
    footer: `
<footer>
  <div class="footer-copy">
    © 2026 <strong>Turquoise Auto Centre Ltd</strong>
    · Juja, Kiambu County · Reg. #023857
  </div>
  <div class="footer-tagline">HAPPINESS IS A SMOOTH RIDE</div>
</footer>`,
  };
}

// Renders a real, crawlable permalink page for a single blog post —
// blog.html itself only ever shows posts inside a JS-built modal, which
// is invisible to WhatsApp/Facebook/Google crawlers that don't run JS.
exports.blogPost = onRequest({ region: 'us-central1' }, async (req, res) => {
  const slug = req.path.split('/').filter(Boolean).pop();

  const snapshot = await admin.firestore()
    .collection('posts')
    .where('slug', '==', slug)
    .limit(1)
    .get();

  if (snapshot.empty) {
    res.status(404).set('Content-Type', 'text/html; charset=utf-8').send(`
<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<title>Post not found | Turquoise Auto Centre</title>
<link rel="stylesheet" href="/css/styles.css"></head>
<body class="light"><div style="text-align:center; padding:120px 20px;">
<h2>Post not found</h2><p><a href="/blog.html">← Back to all posts</a></p>
</div></body></html>`);
    return;
  }

  const post = snapshot.docs[0].data();
  const { header, footer } = siteHeaderFooter();
  const url = `${SITE_URL}/blog/${slug}`;
  const publishedDate = post.published_at?.toDate
    ? post.published_at.toDate().toLocaleDateString()
    : '';

  res.set('Content-Type', 'text/html; charset=utf-8').send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="${escapeHtml(post.excerpt)}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${url}" />

  <meta property="og:type" content="article">
  <meta property="og:url" content="${url}">
  <meta property="og:title" content="${escapeHtml(post.title)}">
  <meta property="og:description" content="${escapeHtml(post.excerpt)}">
  <meta property="og:image" content="${escapeHtml(post.image_url || '')}">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(post.title)}">
  <meta name="twitter:description" content="${escapeHtml(post.excerpt)}">
  <meta name="twitter:image" content="${escapeHtml(post.image_url || '')}">

  <title>${escapeHtml(post.title)} | Turquoise Auto Centre</title>

  <link rel="icon" href="/favicon/favicon.ico" sizes="any" />
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
  <link rel="stylesheet" href="/css/styles.css" />
  <style>
    .post-article { max-width: 760px; margin: 100px auto 60px; padding: 0 20px; }
    .post-article img { width: 100%; border-radius: 8px; margin-bottom: 24px; }
    .post-meta { color: var(--text-muted, #666); margin-bottom: 24px; }
  </style>
</head>
<body class="light">
${header}
<article class="post-article">
  <p><a href="/blog.html">← Back to all posts</a></p>
  ${post.image_url ? `<img src="${escapeHtml(post.image_url)}" alt="${escapeHtml(post.title)}" />` : ''}
  <h1>${escapeHtml(post.title)}</h1>
  <div class="post-meta">${post.category ? escapeHtml(post.category) + ' · ' : ''}${publishedDate}</div>
  <div>${post.content || ''}</div>
</article>
${footer}
</body>
</html>`);
});

// Dynamic sitemap of blog posts, since they live in Firestore rather than
// as static pages — combined with the static sitemap.xml via sitemap-index.xml.
exports.sitemapPosts = onRequest({ region: 'us-central1' }, async (req, res) => {
  const snapshot = await admin.firestore().collection('posts').get();

  const urls = snapshot.docs.map((doc) => {
    const post = doc.data();
    const lastmod = post.updated_at?.toDate
      ? post.updated_at.toDate().toISOString().split('T')[0]
      : '';
    return `  <url>\n    <loc>${SITE_URL}/blog/${post.slug}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`;
  }).join('\n');

  res.set('Content-Type', 'application/xml; charset=utf-8').send(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`
  );
});

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
