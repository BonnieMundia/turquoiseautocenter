# Turquoise Auto Centre - Backend Setup

This guide will help you set up the backend for the contact form using Supabase and Resend.

## Prerequisites

1. [Supabase Account](https://supabase.com) - Sign up for a free account
2. [Resend Account](https://resend.com) - Sign up for email service
3. [Supabase CLI](https://supabase.com/docs/guides/cli) - Install the CLI tool

## Step 1: Initialize Supabase Project

1. Install Supabase CLI if you haven't already:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Initialize the project in your workspace:
   ```bash
   cd /path/to/your/workspace
   supabase init
   ```

4. Link to your remote Supabase project:
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```
   Get your project ref from your Supabase dashboard URL.

## Step 2: Set up Database

1. Start the local Supabase development environment:
   ```bash
   supabase start
   ```

2. Apply the database migration:
   ```bash
   supabase db push
   ```

## Step 3: Set up Resend

1. Sign up at [resend.com](https://resend.com)
2. Get your API key from the dashboard
3. Verify your domain (e.g., turquoiseautocentre.com) in Resend

## Step 4: Configure Environment Variables

Create a `.env.local` file in your project root with:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
RESEND_API_KEY=your_resend_api_key
ADMIN_EMAIL=admin@turquoiseautocentre.com
```

For local development, set these in your Supabase project settings or use the CLI:

```bash
supabase secrets set RESEND_API_KEY=your_resend_api_key
supabase secrets set ADMIN_EMAIL=admin@turquoiseautocentre.com
```

## Step 5: Deploy Edge Functions

1. Deploy the edge function:
   ```bash
   supabase functions deploy submit-enquiry
   ```

2. Set the secrets for production:
   ```bash
   supabase secrets set RESEND_API_KEY=your_resend_api_key --project-ref YOUR_PROJECT_REF
   supabase secrets set ADMIN_EMAIL=admin@turquoiseautocentre.com --project-ref YOUR_PROJECT_REF
   ```

## Step 6: Update Frontend

In your production deployment, make sure the fetch URL points to your Supabase project:

```javascript
const response = await fetch('https://YOUR_PROJECT_REF.supabase.co/functions/v1/submit-enquiry', {
  // ... rest of the code
});
```

Replace `YOUR_PROJECT_REF` with your actual Supabase project reference.

## Database Schema

The `enquiries` table stores:
- `id`: Auto-incrementing primary key
- `name`: Customer name
- `email`: Customer email (optional)
- `phone`: Phone/WhatsApp number
- `service`: Selected service type
- `vehicle`: Vehicle make/model (optional)
- `details`: Additional details (optional)
- `created_at`: Timestamp
- `status`: Enquiry status (pending/contacted/completed/cancelled)

## Email Templates

### Admin Email
Sent to the admin email with enquiry details including customer email if provided.

### Auto-Reply Email
Sent to customer email (if provided) thanking them and confirming receipt. If no email is provided, the admin will handle WhatsApp contact manually.

## Testing

1. Start local development:
   ```bash
   supabase start
   ```

2. Serve your website locally and test the form submission.

3. Check the Supabase dashboard for stored enquiries.

4. Check Resend dashboard for sent emails.

## Troubleshooting

- **CORS Issues**: Make sure the Edge Function includes proper CORS headers
- **Email Not Sending**: Check your Resend API key and domain verification
- **Database Errors**: Ensure the migration ran successfully and RLS policies are correct
- **Function Deployment**: Make sure all dependencies are available in Deno

## Security Notes

- The function validates required fields
- RLS is enabled on the enquiries table
- Only authenticated users can read enquiries (for admin panel)
- Anyone can insert enquiries (for the contact form)