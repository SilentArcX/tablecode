module.exports = {
    apps: [
        {
            name: 'tablecode-server',
            script: './dist/index.js',
            instances: 1,
            autorestart: true,
            watch: false,
            env: {
                NODE_ENV: 'production',
            }
        }
    ]
};