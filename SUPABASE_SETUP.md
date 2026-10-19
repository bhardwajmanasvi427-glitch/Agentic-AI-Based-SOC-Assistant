# Supabase setup

The frontend reads only public browser configuration:

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_KEY
```

Keep these values in `.env.local` or the deployment environment. Never expose
`SUPABASE_SERVICE_ROLE_KEY` to Vite or any browser bundle.

## Apply the database schema

The connected project must run:

`supabase/migrations/202505140001_soc_schema.sql`

Apply it with the Supabase SQL editor or a configured Supabase CLI:

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

The migration creates the SOC tables, seed records, realtime publications,
profile provisioning trigger, approval guard, audit triggers, and Row Level
Security policies.

## Create test accounts

Create users with Supabase Auth, not in the `profiles` table. The database
trigger automatically creates an active `SOC Analyst` profile. An existing
`IT Administrator` can then update profile roles to one of:

- `SOC Analyst`
- `Cybersecurity Engineer`
- `Incident Response Team`
- `IT Administrator`

For the first administrator, update the generated profile from the Supabase
dashboard or SQL editor:

```sql
update public.profiles
set role = 'IT Administrator'
where id = 'AUTH_USER_UUID';
```

Use fictional test identities only.
