/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    // Add your API keys here (use .env.local in production)
    GA4_PROPERTY_ID: process.env.GA4_PROPERTY_ID,
    GA4_API_SECRET: process.env.GA4_API_SECRET,
    INSTAGRAM_ACCESS_TOKEN: process.env.INSTAGRAM_ACCESS_TOKEN,
    FACEBOOK_ACCESS_TOKEN: process.env.FACEBOOK_ACCESS_TOKEN,
    GHL_API_KEY: process.env.GHL_API_KEY,
  }
}

module.exports = nextConfig
