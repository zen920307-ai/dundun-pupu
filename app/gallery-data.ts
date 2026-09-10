import kvData from '../content/kv.json';
import wallpapersData from '../content/wallpapers.json';
import festivalsData from '../content/festivals.json';

// 内容已外置到 content/*.json：本地后台（npm run admin）增删改后自动提交发布，GitHub Actions 重建上线。
// 前端只读这里导出的数组，不要直接改代码里的数据。hidden: true = 后台下架，前端不渲染。
export type Artwork = { id: string; src: string; thumb: string; original?: string; width: number; height: number; title: string; tag: string; hidden?: boolean };

export const kv: Artwork[] = (kvData as Artwork[]).filter((i) => !i.hidden);
export const wallpapers: Artwork[] = (wallpapersData as Artwork[]).filter((i) => !i.hidden);
export const festivals: Artwork[] = (festivalsData as Artwork[]).filter((i) => !i.hidden);
