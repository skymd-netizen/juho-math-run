import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

const page = (name) => fileURLToPath(new URL(`./${name}`, import.meta.url));

export default defineConfig({
  base: './',
  // 태권도 버전(index.html)과 낚시왕 에디션(fishing.html)을 각각 독립된 페이지로 만든다
  build: { rollupOptions: { input: { main: page('index.html'), fishing: page('fishing.html') } } },
  // 임시 공개 URL(터널)로 접속할 수 있도록 미리보기 서버의 호스트 제한을 푼다
  preview: { allowedHosts: true, port: 4173, strictPort: true },
});
