import { defineConfig } from 'vite';
export default defineConfig({
  base: './',
  // 임시 공개 URL(터널)로 접속할 수 있도록 미리보기 서버의 호스트 제한을 푼다
  preview: { allowedHosts: true, port: 4173, strictPort: true },
});
