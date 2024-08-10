module.exports = {
  apps: [
    {
      name: 'mi-app',
      script: 'src/index.js',
      watch: true,
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
      interpreter: 'npx',
      interpreter_args: 'babel-node',
    },
  ],
};
