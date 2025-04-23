export type Gender = "male" | "female";
export type MatchType = "mixed" | "male" | "female";

export interface Player {
  id: string;
  name: string;
  level: number; // 1-5
  gender: Gender;
  group: "terizz" | "tenipang"; // 그룹 속성 다시 추가
  matchesPlayed: number; // 플레이어가 참여한 매치 수
}

export interface Team {
  player1: Player;
  player2: Player;
  averageLevel: number;
}

export interface Match {
  id: string;
  team1: Team;
  team2: Team;
  matchType: MatchType;
  averageLevel: number;
  round: number; // 회차
  court: number; // 코트 번호
}

export interface Round {
  roundNumber: number;
  matches: Match[];
}
