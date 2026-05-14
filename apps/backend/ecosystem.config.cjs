/**
 * PM2 — produção (Docker ou host bare metal).
 * No Docker usamos `pm2-runtime` para logs corretos no stdout.
 */
module.exports = {
  apps: [
    {
      name: "hotspot-api",
      script: "dist/index.js",
      instances: process.env.PM2_INSTANCES || 1,
      exec_mode: process.env.PM2_EXEC_MODE || "fork",
      env_production: {
        NODE_ENV: "production",
      },
    },
  ],
};
