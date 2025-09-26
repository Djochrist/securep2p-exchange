import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  base: '/securep2p-exchange/',
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
