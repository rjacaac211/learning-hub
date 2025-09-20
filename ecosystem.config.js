module.exports = {
  apps: [
    {
      name: 'learning-hub-server',
      script: 'index.js',
      cwd: './server',
      env: {
        PORT: 3001,
        CONTENT_DIR: '/home/pi/content'
      },
      watch: false,
      max_restarts: 10
    }
  ]
};


