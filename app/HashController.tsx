'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

// 跨页锚点直达：在 /travel 等页面点击「/#duo」这类链接回到首页时，
// 路由切换完成后自动平滑滚动到对应模块，不需要再点一次。
// 路由自身的滚动重置和图片加载会与首次滚动竞争，因此滚后持续校验，漂移就补滚。
export default function HashController() {
  const pathname = usePathname();
  useEffect(() => {
    const offset = 112; // scroll-padding-top: nav 92 + 20
    const scrollToHash = () => {
      const hash = window.location.hash;
      if (!hash || hash === '#') return;
      const id = decodeURIComponent(hash.slice(1));
      let tries = 0;
      const attempt = () => {
        const target = document.getElementById(id);
        if (!target) {
          if (tries++ < 30) window.setTimeout(attempt, 100);
          return;
        }
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        let checks = 0;
        const verify = () => {
          const top = target.getBoundingClientRect().top;
          if (Math.abs(top - offset) > 80 && checks < 6) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
          if (++checks < 6) window.setTimeout(verify, 350);
        };
        window.setTimeout(verify, 500);
      };
      attempt();
    };
    scrollToHash();
    window.addEventListener('hashchange', scrollToHash);
    return () => window.removeEventListener('hashchange', scrollToHash);
  }, [pathname]);
  return null;
}
