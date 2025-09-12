# Database Setup Instructions

## Prerequisites

1. Create a Supabase project at https://supabase.com
2. Get your project URL and API keys from the Supabase dashboard

## Environment Configuration

1. Copy the `.env.local` file and update the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Database
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_key_here

# Admin Credentials (for initial setup)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_admin_password
```

## Database Setup

1. Run database migrations:
```bash
npm run db:migrate
```

2. Generate Prisma client:
```bash
npm run db:generate
```

3. Set up initial data (admin user and site settings):
```bash
npm run db:setup
```

## Verification

1. Open Prisma Studio to verify the database:
```bash
npm run db:studio
```

2. Check that the following tables exist:
   - `products`
   - `admin_users`
   - `site_settings`

3. Verify that an admin user was created with your specified credentials.

## Next Steps

After completing the database setup, you can:
- Start the development server: `npm run dev`
- Access the admin dashboard at `/dashboard` (after implementing the UI)
- Use the API endpoints for managing products and settings