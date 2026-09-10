export type Trip = {
  id: string;
  place: string;
  route: string;
  date: string;
  mode: string;
  tag: string;
  title: string;
  story: string[];
  talk: string[];
  receipt: string;
  /** 完整海报地址；不填时前端按 /travel/{place}.webp 约定路径取 */
  poster?: string;
  /** 海报缩略图地址；不填时按 /travel/{place}-thumb.webp 取 */
  posterThumb?: string;
  /** 下架标记：后台设为 true 后前端不渲染 */
  hidden?: boolean;
};

// 内容已外置到 content/travel.json：本地后台（npm run admin）维护，保存发布后自动重建上线。
import tripsData from '../../content/travel.json';

export const trips: Trip[] = (tripsData as Trip[]).filter((t) => !t.hidden);
