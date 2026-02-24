export enum AppView {
  DASHBOARD = 'DASHBOARD',
  COPYWRITER = 'COPYWRITER',
  PRODUCT_STUDIO = 'PRODUCT_STUDIO',
  MODEL_STUDIO = 'MODEL_STUDIO',
  VIDEO_STUDIO = 'VIDEO_STUDIO',
  VIDEO_CLIPPER = 'VIDEO_CLIPPER',
  CHAT_AI = 'CHAT_AI',
}

export interface GeneratedResult {
  id: string;
  type: 'text' | 'image' | 'video';
  content: string; // Text content or URL
  timestamp: number;
  metadata?: any;
}

export type Platform = 'TIKTOK' | 'SHOPEE' | 'INSTAGRAM';
