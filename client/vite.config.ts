import { defineConfig } from 'vite';
import { createHtmlPlugin } from 'vite-plugin-html';

export default defineConfig({
    build: {
        minify: false,
        sourcemap: true,
    },
    plugins: [
        createHtmlPlugin({
            minify: false,
        }),
    ],
});