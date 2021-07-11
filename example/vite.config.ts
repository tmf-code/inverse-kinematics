import reactRefresh from '@vitejs/plugin-react-refresh'
import { defineConfig } from 'vite'

export default defineConfig({
  base: 'https://tmf-code.github.io/inverse-kinematics/',
  plugins: [reactRefresh()],
  server: {
    host: true,
    https: true,
    fs: {
      allow: ['..'],
    },
  },
})
