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

// 매치 점수를 계산하는 함수 (낮을수록 좋음)
function calculateMatchScore(
  team1: Team,
  team2: Team,
  playersInMatch: Player[],
  allPlayersCurrentState: Player[],
  maxLevelDiff: number, // 최대 허용 레벨 차이
  forceStrictGameCount: boolean // 게임 수 차이 1 초과를 허용하지 않을지 여부
): number {
  const levelDiff = getLevelDifference(team1, team2);

  // 제약조건 1: 레벨 차이가 maxLevelDiff보다 크면 매우 높은 페널티
  if (levelDiff > maxLevelDiff) {
    return 1000 + levelDiff;
  }

  // 게임 수 차이 계산 (이 매치가 성사될 경우)
  const potentialGamesState = allPlayersCurrentState.map((p) => {
    if (playersInMatch.some((pm) => pm.id === p.id)) {
      return p.matchesPlayed + 1;
    }
    return p.matchesPlayed;
  });
  const potentialMaxGames = Math.max(...potentialGamesState);
  const potentialMinGames = Math.min(...potentialGamesState);
  const potentialOverallGamesDiff = potentialMaxGames - potentialMinGames;

  // 제약조건 2: 게임 수 차이가 1보다 크면 페널티
  if (potentialOverallGamesDiff > 1) {
    if (forceStrictGameCount) {
      // 엄격 모드: 게임 수 차이 > 1이면 높은 페널티
      return 50 + potentialOverallGamesDiff;
    } else {
      // 완화 모드: 게임 수 차이 > 1도 허용, 레벨 차이 + 게임 수 차이로 점수 계산
      // 레벨 차이보다 게임 수 차이 페널티를 약간 낮게 반영할 수 있음 (예: * 0.8)
      return levelDiff + potentialOverallGamesDiff * 0.8; // 게임 수 차이를 점수에 반영
    }
  }

  // 두 제약조건(레벨 차이, 게임 수 차이(엄격 모드 시))을 모두 만족하면, 레벨 차이 자체를 점수로 사용
  return levelDiff;
}

// 주어진 제약 조건 내에서 최적의 매치를 찾아 반환 (점수 포함)
function findBestPairs(
  availablePlayers: Player[],
  matchType: MatchType,
  partnerHistory: PartnerHistory,
  allPlayersCurrentState: Player[],
  maxLevelDiff: number,
  forceStrictGameCount: boolean
): { team1: Team; team2: Team; score: number } | null {
  if (availablePlayers.length < 4) return null;

  let bestMatch: { team1: Team; team2: Team } | null = null;
  let bestScore = Infinity;

  for (let i = 0; i < availablePlayers.length; i++) {
    for (let j = i + 1; j < availablePlayers.length; j++) {
      for (let k = j + 1; k < availablePlayers.length; k++) {
        for (let l = k + 1; l < availablePlayers.length; l++) {
          const p1 = availablePlayers[i];
          const p2 = availablePlayers[j];
          const p3 = availablePlayers[k];
          const p4 = availablePlayers[l];
          const currentMatchPlayers = [p1, p2, p3, p4];

          const hasPlayedTogether = (player1: Player, player2: Player) => {
            return (
              partnerHistory[player1.id]?.has(player2.id) ||
              partnerHistory[player2.id]?.has(player1.id)
            );
          };

          const combinations = [
            { t1p1: p1, t1p2: p2, t2p1: p3, t2p2: p4 },
            { t1p1: p1, t1p2: p3, t2p1: p2, t2p2: p4 },
            { t1p1: p1, t1p2: p4, t2p1: p2, t2p2: p3 },
          ];

          for (const combo of combinations) {
            const { t1p1, t1p2, t2p1, t2p2 } = combo;
            let isValidCombo = false;
            if (matchType === "mixed") {
              isValidCombo =
                t1p1.gender !== t1p2.gender &&
                t2p1.gender !== t2p2.gender &&
                !hasPlayedTogether(t1p1, t1p2) &&
                !hasPlayedTogether(t2p1, t2p2);
            } else {
              isValidCombo =
                t1p1.gender === matchType &&
                t1p2.gender === matchType &&
                t2p1.gender === matchType &&
                t2p2.gender === matchType &&
                !hasPlayedTogether(t1p1, t1p2) &&
                !hasPlayedTogether(t2p1, t2p2);
            }

            if (isValidCombo) {
              const tempTeam1 = createTeam(t1p1, t1p2);
              const tempTeam2 = createTeam(t2p1, t2p2);
              const score = calculateMatchScore(
                tempTeam1,
                tempTeam2,
                currentMatchPlayers,
                allPlayersCurrentState,
                maxLevelDiff,
                forceStrictGameCount
              );

              // 더 낮은 점수를 찾으면 업데이트
              if (score < bestScore) {
                bestScore = score;
                bestMatch = { team1: tempTeam1, team2: tempTeam2 };
              }
            }
          }
        }
      }
    }
  }

  // 찾은 최저 점수가 제약 조건 페널티(50 또는 1000)보다 낮은 경우에만 매치 반환
  if (bestMatch) {
    const penaltyThreshold = forceStrictGameCount ? 50 : 1000;
    if (bestScore < penaltyThreshold) {
      return { ...bestMatch, score: bestScore };
    }
  }

  return null; // 제약 조건 만족 매치 없음
}

export function generateMatches(
  players: Player[],
  initialMatchType: MatchType, // 사용자가 초기에 요청한 매치 타입
  priorityType: MatchType, // 현재 사용 안 함
  numberOfCourts: number,
  numberOfRounds: number
): Round[] {
  if (players.length < 4) {
    throw new Error("최소 4명의 플레이어가 필요합니다.");
  }

  const rounds: Round[] = [];
  const partnerHistory: PartnerHistory = {};
  let totalMatchesGenerated = 0;
  const targetTotalMatches = numberOfCourts * numberOfRounds;

  let currentPlayersState = players.map((p) => ({ ...p, matchesPlayed: 0 }));
  currentPlayersState.forEach((player) => {
    partnerHistory[player.id] = new Set<string>();
  });

  for (let roundNum = 1; roundNum <= numberOfRounds; roundNum++) {
    const roundMatches: Match[] = [];
    const usedPlayersThisRound = new Set<string>();

    while (roundMatches.length < numberOfCourts) {
      const availablePlayersForAttempt = currentPlayersState
        .filter((p) => !usedPlayersThisRound.has(p.id))
        .sort((a, b) => a.matchesPlayed - b.matchesPlayed);

      if (availablePlayersForAttempt.length < 4) break;

      let matchInfo: { team1: Team; team2: Team; score: number } | null = null;
      let actualMatchTypeUsed: MatchType = initialMatchType;
      let attemptDescription = "";

      // --- 시도 함수 정의 ---
      const tryFindMatch = (
        playersToTry: Player[],
        type: MatchType,
        level: number,
        strictGame: boolean
      ): {
        info: { team1: Team; team2: Team; score: number } | null;
        typeUsed: MatchType;
      } => {
        // 타입 유효성 검사
        if (type === "mixed") {
          const males = playersToTry.filter((p) => p.gender === "male").length;
          const females = playersToTry.filter(
            (p) => p.gender === "female"
          ).length;
          if (males < 2 || females < 2) return { info: null, typeUsed: type };
        } else {
          const requiredGender = type;
          const count = playersToTry.filter(
            (p) => p.gender === requiredGender
          ).length;
          if (count < 4) return { info: null, typeUsed: type };
        }
        const result = findBestPairs(
          playersToTry,
          type,
          partnerHistory,
          currentPlayersState,
          level,
          strictGame
        );
        return { info: result, typeUsed: type };
      };

      // --- 순차적 시도 실행 ---
      // 1. Strict
      attemptDescription = `Strict (L:1.0, G:Strict, T:${initialMatchType})`;
      let attemptResult = tryFindMatch(
        availablePlayersForAttempt,
        initialMatchType,
        1.0,
        true
      );
      matchInfo = attemptResult.info;
      actualMatchTypeUsed = attemptResult.typeUsed;

      // 2. Relax Match Type
      if (!matchInfo) {
        attemptDescription = `Relax Type (L:1.0, G:Strict)`;
        console.log(
          `R${roundNum} C${roundMatches.length + 1}: ${attemptDescription}...`
        );
        const altTypes: MatchType[] =
          initialMatchType === "mixed" ? ["male", "female"] : ["mixed"];
        for (const altType of altTypes) {
          attemptResult = tryFindMatch(
            availablePlayersForAttempt,
            altType,
            1.0,
            true
          );
          if (attemptResult.info) {
            matchInfo = attemptResult.info;
            actualMatchTypeUsed = attemptResult.typeUsed;
            console.log(`...Success with type: ${actualMatchTypeUsed}`);
            break;
          }
        }
      }

      // 3. Relax Level
      if (!matchInfo) {
        attemptDescription = `Relax Level (L:1.5, G:Strict, T:${initialMatchType})`;
        console.log(
          `R${roundNum} C${roundMatches.length + 1}: ${attemptDescription}...`
        );
        attemptResult = tryFindMatch(
          availablePlayersForAttempt,
          initialMatchType,
          1.5,
          true
        );
        if (attemptResult.info) {
          matchInfo = attemptResult.info;
          actualMatchTypeUsed = attemptResult.typeUsed;
          console.log(`...Success with relaxed level.`);
        }
      }

      // 4. Relax Level & Match Type
      if (!matchInfo) {
        attemptDescription = `Relax Level & Type (L:1.5, G:Strict)`;
        console.log(
          `R${roundNum} C${roundMatches.length + 1}: ${attemptDescription}...`
        );
        const altTypes: MatchType[] =
          initialMatchType === "mixed" ? ["male", "female"] : ["mixed"];
        for (const altType of altTypes) {
          attemptResult = tryFindMatch(
            availablePlayersForAttempt,
            altType,
            1.5,
            true
          );
          if (attemptResult.info) {
            matchInfo = attemptResult.info;
            actualMatchTypeUsed = attemptResult.typeUsed;
            console.log(
              `...Success with type: ${actualMatchTypeUsed} and relaxed level.`
            );
            break;
          }
        }
      }

      // 5. Relax Game Count
      if (!matchInfo) {
        attemptDescription = `Relax Game Count (L:1.5, G:Relaxed)`;
        console.log(
          `R${roundNum} C${roundMatches.length + 1}: ${attemptDescription}...`
        );
        // 원본 타입 먼저 시도
        attemptResult = tryFindMatch(
          availablePlayersForAttempt,
          initialMatchType,
          1.5,
          false
        );
        matchInfo = attemptResult.info;
        actualMatchTypeUsed = attemptResult.typeUsed;

        if (!matchInfo) {
          // 원본 타입 실패 시 대안 타입 시도
          const altTypes: MatchType[] =
            initialMatchType === "mixed" ? ["male", "female"] : ["mixed"];
          for (const altType of altTypes) {
            attemptResult = tryFindMatch(
              availablePlayersForAttempt,
              altType,
              1.5,
              false
            );
            if (attemptResult.info) {
              matchInfo = attemptResult.info;
              actualMatchTypeUsed = attemptResult.typeUsed;
              console.log(`...Success with type: ${actualMatchTypeUsed}`);
              break;
            }
          }
        }
        if (matchInfo) console.log(`...Success with relaxed game count.`);
      }

      // --- 결과 처리 ---
      if (matchInfo) {
        console.log(
          `Match found using attempt: ${attemptDescription} (Type: ${actualMatchTypeUsed}, Score: ${matchInfo.score.toFixed(
            2
          )})`
        );
        const match = { team1: matchInfo.team1, team2: matchInfo.team2 };
        const playerIdsInMatch = [
          match.team1.player1.id,
          match.team1.player2.id,
          match.team2.player1.id,
          match.team2.player2.id,
        ];

        currentPlayersState = currentPlayersState.map((p) =>
          playerIdsInMatch.includes(p.id)
            ? { ...p, matchesPlayed: p.matchesPlayed + 1 }
            : p
        );
        partnerHistory[match.team1.player1.id].add(match.team1.player2.id);
        partnerHistory[match.team1.player2.id].add(match.team1.player1.id);
        partnerHistory[match.team2.player1.id].add(match.team2.player2.id);
        partnerHistory[match.team2.player2.id].add(match.team2.player1.id);
        playerIdsInMatch.forEach((id) => usedPlayersThisRound.add(id));

        roundMatches.push({
          id: `match-${roundNum}-${roundMatches.length + 1}`,
          court: roundMatches.length + 1,
          team1: match.team1,
          team2: match.team2,
          matchType: actualMatchTypeUsed,
          averageLevel:
            (match.team1.averageLevel + match.team2.averageLevel) / 2,
          round: roundNum,
        });
        totalMatchesGenerated++;
      } else {
        console.warn(
          `R${roundNum} C${
            roundMatches.length + 1
          }: All attempts failed. Stopping round.`
        );
        break; // 현재 라운드 중단
      }
    } // end while

    if (roundMatches.length > 0) {
      rounds.push({ roundNumber: roundNum, matches: roundMatches });
    } else {
      console.warn(`Round ${roundNum}: No matches generated.`);
    }
  } // end for roundNum

  console.log(
    `Target: ${targetTotalMatches}, Generated: ${totalMatchesGenerated}`
  );
  if (totalMatchesGenerated < targetTotalMatches) {
    console.warn("Could not generate target matches due to constraints.");
  }
  if (rounds.length === 0 && numberOfRounds > 0) {
    throw new Error(
      "매치를 생성할 수 없습니다. 플레이어/코트 수나 조건을 확인하세요."
    );
  }
  return rounds;
}
