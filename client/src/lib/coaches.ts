import type { CoachType } from "@/contexts/AppContext";

export const COACH_DATA: Record<CoachType, {
  name: string;
  image: string;
  description: string;
  personality: string;
  greeting: string;
}> = {
  cat: {
    name: "ミケ",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663097564530/knVDDtcSL2Wdwe8QpUtBw5/coach-cat-VvuziajSwaakMFyD7U63Qf.webp",
    description: "やさしく寄り添うサポーター",
    personality: "共感型。あなたの気持ちに寄り添いながら、一歩ずつ前に進むお手伝いをします。",
    greeting: "こんにちは！一緒にがんばろうね。焦らなくていいよ、まずは深呼吸から。",
  },
  owl: {
    name: "フクロウ先生",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663097564530/knVDDtcSL2Wdwe8QpUtBw5/coach-owl-2NhoEHvyp5wFpGN6AWndkT.webp",
    description: "冷静に分析する軍師タイプ",
    personality: "分析型。あなたの行動パターンを分析し、最適な戦略を提案します。",
    greeting: "ようこそ。まずは状況を整理しましょう。データに基づいた最適な計画を立てますよ。",
  },
  dog: {
    name: "ゴン太",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663097564530/knVDDtcSL2Wdwe8QpUtBw5/coach-dog-Bhz2XwuZM2qrBxwG2VcAtn.webp",
    description: "元気いっぱいの応援団長",
    personality: "応援型。全力であなたを応援します！やる気が出ないときも、一緒に盛り上げていきます。",
    greeting: "よっしゃー！今日もがんばろう！5分だけでいいから、一緒にスタートしよう！",
  },
};
