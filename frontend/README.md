# frontend

# Dependencies

Aside from the directory_service API, you'll also need to set google SSO for authentication.

RE: https://karthickragavendran.medium.com/setup-guide-for-nextauth-with-google-and-credentials-providers-in-next-js-13-8f5f13414c1e

# Configuration

The directory_service frontend expects the following environment variables to be set

- NEXTAUTH_URL = URL for your service (RE: http://localhost:3000)
- NEXTAUTH_SECRET = Used to encrypt the NextAuth.js JWT, and to hash email verification tokens.
- API_URL = Directory service api backend (RE: https://ikoikoia.execute-api.us-east-1.amazonaws.com/global)
- ADMIN_API_KEY -  directory-service-admin-key from the directory_service API
- GOOGLE_ID - Google ID for NextAuth
- GOOGLE_SECRET - Google secret for NextAuth

# Granting initial admin access

To grant an initial user admin access to the directory_service frontend, you need to use the API to make them a member of the `directory_service_admins` group.

```
curl -X POST "${DIR_SVC_API_BASE_URL}/v1/admin/users" \
-H "x-api-key: ${ADMIN_DIR_SVC_API_KEY}" \
-H "Content-Type: application/json" \
-d '{
    "user_id": "admin@my.com",
    "group_name": "directory_service_admins"
}'
```

# Admin roles

The access paradigm for diretory_service is simplistic.

- **Service Admin** - granting someone the `Service Admin` role will give them full admin access to the directory_service frontend, allowing them to add new services and grant people membership to groups.
- **Group Admin** - granting someone the `Group Admin` role will give them they ability to add others to any group they're a member of.

# nextjs boiler plate

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
