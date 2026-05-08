import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface EnquiryData {
  name: string
  email?: string
  phone: string
  service: string
  vehicle: string
  details: string
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Parse request body
    const enquiryData: EnquiryData = await req.json()

    // Validate required fields
    if (!enquiryData.name || !enquiryData.phone || !enquiryData.service) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Store enquiry in database
    const { data, error: dbError } = await supabaseClient
      .from('enquiries')
      .insert([
        {
          name: enquiryData.name,
          email: enquiryData.email || null,
          phone: enquiryData.phone,
          service: enquiryData.service,
          vehicle: enquiryData.vehicle || null,
          details: enquiryData.details || null,
          created_at: new Date().toISOString(),
        }
      ])

    if (dbError) {
      console.error('Database error:', dbError)
      return new Response(JSON.stringify({ error: 'Failed to store enquiry' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Send email to admin
    const adminEmailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Turquoise Auto Centre <noreply@turquoiseautocentre.com>',
        to: [Deno.env.get('ADMIN_EMAIL') || 'admin@turquoiseautocentre.com'],
        subject: 'New Service Enquiry',
        html: `
          <h2>New Service Enquiry Received</h2>
          <p><strong>Name:</strong> ${enquiryData.name}</p>
          <p><strong>Email:</strong> ${enquiryData.email || 'Not provided'}</p>
          <p><strong>Phone:</strong> ${enquiryData.phone}</p>
          <p><strong>Service:</strong> ${enquiryData.service}</p>
          <p><strong>Vehicle:</strong> ${enquiryData.vehicle || 'Not specified'}</p>
          <p><strong>Details:</strong></p>
          <p>${enquiryData.details || 'No additional details'}</p>
          <hr>
          <p>This enquiry has been stored in the database.</p>
        `,
      }),
    })

    if (!adminEmailResponse.ok) {
      console.error('Failed to send admin email:', await adminEmailResponse.text())
    }

    // Send auto-reply to customer if email provided
    if (enquiryData.email) {
      const customerEmailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Turquoise Auto Centre <noreply@turquoiseautocentre.com>',
          to: [enquiryData.email],
          subject: 'Thank you for your enquiry - Turquoise Auto Centre',
          html: `
            <h2>Thank you for contacting Turquoise Auto Centre Ltd!</h2>
            <p>Dear ${enquiryData.name},</p>
            <p>We have received your service enquiry for: <strong>${enquiryData.service}</strong></p>
            <p>Our team will contact you shortly at ${enquiryData.phone} to discuss your requirements and schedule your service.</p>
            <p><strong>Service Details:</strong></p>
            <ul>
              <li><strong>Service:</strong> ${enquiryData.service}</li>
              <li><strong>Vehicle:</strong> ${enquiryData.vehicle || 'Not specified'}</li>
              <li><strong>Additional Details:</strong> ${enquiryData.details || 'None provided'}</li>
            </ul>
            <p>If you have any urgent questions, please call us at +254 116 967804.</p>
            <p>Best regards,<br>Turquoise Auto Centre Ltd<br>Juja, Kiambu County</p>
          `,
        }),
      })

      if (!customerEmailResponse.ok) {
        console.error('Failed to send customer email:', await customerEmailResponse.text())
      }
    }

    return new Response(JSON.stringify({ success: true, message: 'Enquiry submitted successfully' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error processing enquiry:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})