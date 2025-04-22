import { Player, Match, MatchType, Team, Round } from "../types";

function createTeam(player1: Player, player2: Player): Team {
  return {
    player1,
    player2,
    averageLevel: (player1.level + player2.level) / 2,
  };
}

function getLevelDifference(team1: Team, team2: Team): number {
  return Math.abs(team1.averageLevel - team2.averageLevel);
}

// 이전 파트너 기록을 위한 타입
type PartnerHistory = {
  [playerId: string]: Set<string>;
};

function findBestPairs(
  availablePlayers: Player[],
  matchType: MatchType,
  partnerHistory: PartnerHistory
): { team1: Team; team2: Team } | null {
  if (availablePlayers.length < 4) return null;

  let bestMatch: { team1: Team; team2: Team } | null = null;
  let minLevelDiff = Infinity;

  // 플레이어 조합 시도
  for (let i = 0; i < availablePlayers.length; i++) {
    for (let j = i + 1; j < availablePlayers.length; j++) {
      for (let k = j + 1; k < availablePlayers.length; k++) {
        for (let l = k + 1; l < availablePlayers.length; l++) {
          const p1 = availablePlayers[i];
          const p2 = availablePlayers[j];
          const p3 = availablePlayers[k];
          const p4 = availablePlayers[l];

          // 이전에 함께 플레이한 적이 있는지 확인
          const hasPlayedTogether = (player1: Player, player2: Player) => {
            return (
              partnerHistory[player1.id]?.has(player2.id) ||
              partnerHistory[player2.id]?.has(player1.id)
            );
          };

          // 매치 타입에 따른 검증
          let isValidMatch = false;
          let team1: Team | null = null;
          let team2: Team | null = null;

          if (matchType === "mixed") {
            // 혼복: 각 팀에 남녀 한 명씩
            const combinations = [
              // [p1,p2] vs [p3,p4]
              {
                t1p1: p1,
                t1p2: p2,
                t2p1: p3,
                t2p2: p4,
              },
              // [p1,p3] vs [p2,p4]
              {
                t1p1: p1,
                t1p2: p3,
                t2p1: p2,
                t2p2: p4,
              },
              // [p1,p4] vs [p2,p3]
              {
                t1p1: p1,
                t1p2: p4,
                t2p1: p2,
                t2p2: p3,
              },
            ];

            for (const combo of combinations) {
              const { t1p1, t1p2, t2p1, t2p2 } = combo;
              if (
                t1p1.gender !== t1p2.gender &&
                t2p1.gender !== t2p2.gender &&
                !hasPlayedTogether(t1p1, t1p2) &&
                !hasPlayedTogether(t2p1, t2p2)
              ) {
                const tempTeam1 = createTeam(t1p1, t1p2);
                const tempTeam2 = createTeam(t2p1, t2p2);
                const levelDiff = getLevelDifference(tempTeam1, tempTeam2);

                if (levelDiff < minLevelDiff) {
                  minLevelDiff = levelDiff;
                  team1 = tempTeam1;
                  team2 = tempTeam2;
                  isValidMatch = true;
                }
              }
            }
          } else {
            // 남복/여복: 같은 성별
            if (
              p1.gender === matchType &&
              p2.gender === matchType &&
              p3.gender === matchType &&
              p4.gender === matchType
            ) {
              const combinations = [
                // [p1,p2] vs [p3,p4]
                {
                  t1p1: p1,
                  t1p2: p2,
                  t2p1: p3,
                  t2p2: p4,
                },
                // [p1,p3] vs [p2,p4]
                {
                  t1p1: p1,
                  t1p2: p3,
                  t2p1: p2,
                  t2p2: p4,
                },
                // [p1,p4] vs [p2,p3]
                {
                  t1p1: p1,
                  t1p2: p4,
                  t2p1: p2,
                  t2p2: p3,
                },
              ];

              for (const combo of combinations) {
                const { t1p1, t1p2, t2p1, t2p2 } = combo;
                if (
                  !hasPlayedTogether(t1p1, t1p2) &&
                  !hasPlayedTogether(t2p1, t2p2)
                ) {
                  const tempTeam1 = createTeam(t1p1, t1p2);
                  const tempTeam2 = createTeam(t2p1, t2p2);
                  const levelDiff = getLevelDifference(tempTeam1, tempTeam2);

                  if (levelDiff < minLevelDiff) {
                    minLevelDiff = levelDiff;
                    team1 = tempTeam1;
                    team2 = tempTeam2;
                    isValidMatch = true;
                  }
                }
              }
            }
          }

          if (isValidMatch && team1 && team2) {
            bestMatch = { team1, team2 };
          }
        }
      }
    }
  }

  return bestMatch;
}

export function generateMatches(
  players: Player[],
  matchType: MatchType,
  priorityType: MatchType,
  numberOfCourts: number,
  numberOfRounds: number
): Round[] {
  if (players.length < 4) {
    throw new Error("최소 4명의 플레이어가 필요합니다.");
  }

  const rounds: Round[] = [];
  const partnerHistory: PartnerHistory = {};

  // 파트너 히스토리 초기화
  players.forEach((player) => {
    partnerHistory[player.id] = new Set<string>();
  });

  for (let round = 1; round <= numberOfRounds; round++) {
    const roundMatches: Match[] = [];
    const usedPlayers = new Set<string>();

    for (let court = 1; court <= numberOfCourts; court++) {
      const availablePlayers = players.filter((p) => !usedPlayers.has(p.id));

      if (availablePlayers.length < 4) break;

      const match = findBestPairs(availablePlayers, matchType, partnerHistory);

      if (match) {
        // 파트너 히스토리 업데이트
        partnerHistory[match.team1.player1.id].add(match.team1.player2.id);
        partnerHistory[match.team1.player2.id].add(match.team1.player1.id);
        partnerHistory[match.team2.player1.id].add(match.team2.player2.id);
        partnerHistory[match.team2.player2.id].add(match.team2.player1.id);

        // 사용된 플레이어 표시
        usedPlayers.add(match.team1.player1.id);
        usedPlayers.add(match.team1.player2.id);
        usedPlayers.add(match.team2.player1.id);
        usedPlayers.add(match.team2.player2.id);

        roundMatches.push({
          id: `match-${round}-${court}`,
          team1: match.team1,
          team2: match.team2,
          matchType,
          averageLevel:
            (match.team1.averageLevel + match.team2.averageLevel) / 2,
          round,
          court,
        });
      }
    }

    if (roundMatches.length > 0) {
      rounds.push({
        roundNumber: round,
        matches: roundMatches,
      });
    }
  }

  if (rounds.length === 0) {
    throw new Error("생성 가능한 매치가 없습니다.");
  }

  return rounds;
}
