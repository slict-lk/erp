/** @type {import('next').NextConfig} */
const nextConfig = {
    async headers() {
        return [
            {
                // Matches all API routes
                source: "/api/public/:path*",
                headers: [
                    { key: "Access-Control-Allow-Credentials", value: "true" },
                    { key: "Access-Control-Allow-Origin", value: "*" }, // Replace with your frontend domain in production
                    { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT" },
                    {
                        key: "Access-Control-Allow-Headers",
                        value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Tenant-Subdomain, Authorization"
                    },
                ]
            }
        ]
    }
};

export default nextConfig;
