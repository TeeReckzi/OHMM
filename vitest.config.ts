import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      react: path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
      'react/jsx-runtime': path.resolve(__dirname, './node_modules/react/jsx-runtime'),
      'react/jsx-dev-runtime': path.resolve(__dirname, './node_modules/react/jsx-dev-runtime'),
    },
  },
  test: {
    globals: false,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['src/ohai/**', 'node_modules/**'],
    passWithNoTests: true,
    setupFiles: ['./vitest.setup.ts'],
  },
})
