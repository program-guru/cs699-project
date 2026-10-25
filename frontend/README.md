This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

This frontend uses npm. From this directory, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Authentication

The admin login uses the backend's `access_token` HTTP-only cookie. Set
`NEXT_PUBLIC_API_URL` to the backend URL when it is not running at
`http://localhost:8000`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev
```

Requests use RTK Query with credentials enabled. The admin `proxy.ts` redirects
requests without an `access_token` cookie to `/login`.

The homepage is implemented in `app/page.tsx`. The page auto-updates as
you edit files.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts)
to automatically optimize and load Inter and Montserrat.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
