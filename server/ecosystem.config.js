module.exports = {
    apps: [
        {
            name: 'dashboard',
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