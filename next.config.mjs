/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      domains: [
        'hxjhqzqgmjoariceuhba.supabase.co', // Supabase storage domain
        'placehold.jp', // For our placeholder images
      ],
      remotePatterns: [
        {
          protocol: 'https',
          hostname: '*.supabase.co',
          pathname: '/storage/v1/object/public/**',
        },
      ],
    },
  };
  
  export default nextConfig;