module.exports = {
  apps: [
    {
      name: 'bringus-backend',
      script: 'server.js',
      instances: 1,
      autorestart: true,
      watch: [
        'server.js',
        'Routes/',
        'Controllers/',
        'Models/',
        'middleware/',
        'services/',
        'utils/',
        'validators/'
      ],
      ignore_watch: [
        'node_modules/',
        'logs/',
        '*.log',
        'npm-debug.log*',
        'yarn-debug.log*',
        'yarn-error.log*',
        '.git/',
        '.DS_Store',
        'coverage/',
        'test/',
        'tests/',
        '*.test.js',
        '*.spec.js',
        'examples/',
        'scripts/'
      ],
      env: {
        NODE_ENV: 'development',
        PORT: 5001
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5001
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      max_memory_restart: '1G',
      restart_delay: 1000,
      max_restarts: 10,
      min_uptime: '10s',
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 8000
    }
  ]
};
