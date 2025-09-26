import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      models: path.resolve(__dirname, 'src/models'),
      network: path.resolve(__dirname, 'src/network'),
      types: path.resolve(__dirname, 'src/types'),
      security: path.resolve(__dirname, 'src/security'),
    }
  }
})
