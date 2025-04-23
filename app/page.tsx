import type { Metadata } from "next";
import MatchMakerClient from "./components/MatchMakerClient"; // 클라이언트 컴포넌트 임포트

// Metadata 정의 (서버에서 처리)
export const metadata: Metadata = {
  openGraph: {
    title: "match-maker",
    description: "테리쯔 X 테니팡 정기전",
    images: [
      {
        url: "/og-image.png", // og-image 경로 추가
      },
    ],
  },
};

// 페이지 컴포넌트 (서버 컴포넌트)
export default function Page() {
  // 클라이언트 컴포넌트를 렌더링
  return <MatchMakerClient />;
}
