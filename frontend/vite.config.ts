import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 開発時は VITE_API_BASE で PHP バックエンドのURLを指定する（.env 参照）。
//
// base: '/task-board/' … アプリの公開パス。パスパラメータ方式のルーティング
//   （/task-board/<projectKey> など）でもアセット参照が壊れないよう絶対パスにする。
//   ルーターはこの値を import.meta.env.BASE_URL 経由で参照する。
export default defineConfig({
  base: '/task-board/',
  plugins: [react()],
  server: {
    port: 5173,
  },
})
