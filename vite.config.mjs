import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'url';

export default defineConfig({
    define: {
        global: 'globalThis',
    },
    plugins: [
        vue(),
    ],
    root: '.',
    build: {
        outDir: 'public/dist',
        emptyOutDir: true,
        rollupOptions: {
            input: {
                app: fileURLToPath(new URL('./index.html', import.meta.url)),
            },
        },
    },
    css: {
        preprocessorOptions: {
            scss: {
                api: 'modern',
            },
        },
    },
    server: {
        port: 8080,
        proxy: {
            '/signin': 'http://localhost:3000',
            '/signout': 'http://localhost:3000',
            '/register': 'http://localhost:3000',
            '/saveLibrary': 'http://localhost:3000',
            '/externalId': 'http://localhost:3000',
            '/forgotPassword': 'http://localhost:3000',
            '/forgotUsername': 'http://localhost:3000',
            '/account': 'http://localhost:3000',
            '/delete-account': 'http://localhost:3000',
            '/imageUpload': 'http://localhost:3000',
            '/uploads': { 
                target:'http://localhost:3000', // This must be changed back to https at some point: https://localhost:3000, only for testing.
                secure: false,
            },    
            '/moderation': 'http://localhost:3000',
            '/r': 'http://localhost:3000',
            '/e': 'http://localhost:3000',
            '/csv': 'http://localhost:3000',
        },
    },
});