"use client";

import { useState } from "react";
import { Player, MatchType, Round } from "./types";
import { generateMatches } from "./utils/matchGenerator";

export default function Home() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [matchType, setMatchType] = useState<MatchType>("mixed");
  const [numberOfCourts, setNumberOfCourts] = useState<number>(1);
  const [numberOfRounds, setNumberOfRounds] = useState<number>(1);
  const [error, setError] = useState<string>("");
  const [newPlayer, setNewPlayer] = useState<
    Omit<Player, "id" | "matchesPlayed">
  >({
    name: "",
    level: 3,
    gender: "male",
  });

  const handleAddPlayer = () => {
    if (newPlayer.name.trim()) {
      setPlayers([
        ...players,
        { ...newPlayer, id: `player-${players.length + 1}`, matchesPlayed: 0 },
      ]);
      setNewPlayer({ name: "", level: 3, gender: "male" });
      setError("");
    }
  };

  const handleGenerateMatches = () => {
    try {
      const generatedRounds = generateMatches(
        players,
        matchType,
        matchType,
        numberOfCourts,
        numberOfRounds
      );
      setRounds(generatedRounds);
      setError("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "대진표 생성 중 오류가 발생했습니다."
      );
      setRounds([]);
    }
  };

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">테니스 대진표 생성기</h1>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">플레이어 등록</h2>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            placeholder="이름"
            value={newPlayer.name}
            onChange={(e) =>
              setNewPlayer({ ...newPlayer, name: e.target.value })
            }
            className="border p-2 rounded"
          />
          <select
            value={newPlayer.level}
            onChange={(e) =>
              setNewPlayer({ ...newPlayer, level: Number(e.target.value) })
            }
            className="border p-2 rounded"
          >
            {[1, 2, 3, 4, 5].map((level) => (
              <option key={level} value={level}>
                레벨 {level}
              </option>
            ))}
          </select>
          <select
            value={newPlayer.gender}
            onChange={(e) =>
              setNewPlayer({
                ...newPlayer,
                gender: e.target.value as "male" | "female",
              })
            }
            className="border p-2 rounded"
          >
            <option value="male">남성</option>
            <option value="female">여성</option>
          </select>
          <button
            onClick={handleAddPlayer}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            추가
          </button>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">등록된 플레이어</h2>
        <ul className="grid grid-cols-2 gap-2">
          {players.map((player) => (
            <li
              key={player.id}
              className={`border p-2 rounded ${
                player.gender === "male"
                  ? "bg-white border-blue-400"
                  : "bg-white border-pink-400"
              }`}
            >
              <span
                className={
                  player.gender === "male" ? "text-blue-700" : "text-pink-700"
                }
              >
                {player.name}
              </span>{" "}
              (레벨 {player.level},{" "}
              <span
                className={
                  player.gender === "male" ? "text-blue-600" : "text-pink-600"
                }
              >
                {player.gender === "male" ? "남성" : "여성"}
              </span>
              )
            </li>
          ))}
        </ul>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">대진표 생성</h2>
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <select
              value={matchType}
              onChange={(e) => setMatchType(e.target.value as MatchType)}
              className="border p-2 rounded"
            >
              <option value="mixed">혼복</option>
              <option value="male">남복</option>
              <option value="female">여복</option>
            </select>
            <select
              value={numberOfCourts}
              onChange={(e) => setNumberOfCourts(Number(e.target.value))}
              className="border p-2 rounded"
            >
              {Array.from({ length: 4 }, (_, i) => i + 1).map((num) => (
                <option key={num} value={num}>
                  {num}코트
                </option>
              ))}
            </select>
            <select
              value={numberOfRounds}
              onChange={(e) => setNumberOfRounds(Number(e.target.value))}
              className="border p-2 rounded"
            >
              {[1, 2, 3, 4, 5].map((num) => (
                <option key={num} value={num}>
                  {num}회차
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleGenerateMatches}
            className="bg-green-500 text-white px-4 py-2 rounded"
            disabled={players.length < 4}
          >
            대진표 생성
          </button>
          {error && <p className="text-red-500">{error}</p>}
        </div>
      </div>

      {rounds.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">생성된 대진표</h2>
          {rounds.map((round) => (
            <div key={round.roundNumber} className="mb-8">
              <h3 className="text-lg font-semibold mb-4">
                회차 {round.roundNumber}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {round.matches.map((match) => (
                  <div key={match.id} className="border p-4 rounded shadow-sm">
                    <p className="font-semibold mb-2">코트 {match.court}</p>
                    <div className="mb-2">
                      <p className="font-semibold">팀 1</p>
                      <p className="text-sm">
                        <span
                          className={
                            match.team1.player1.gender === "male"
                              ? "text-blue-600"
                              : "text-pink-600"
                          }
                        >
                          {match.team1.player1.name}
                        </span>
                        {" & "}
                        <span
                          className={
                            match.team1.player2.gender === "male"
                              ? "text-blue-600"
                              : "text-pink-600"
                          }
                        >
                          {match.team1.player2.name}
                        </span>
                      </p>
                      <p className="text-sm text-gray-600">
                        평균 레벨: {match.team1.averageLevel}
                      </p>
                    </div>
                    <div className="mb-2">
                      <p className="font-semibold">팀 2</p>
                      <p className="text-sm">
                        <span
                          className={
                            match.team2.player1.gender === "male"
                              ? "text-blue-600"
                              : "text-pink-600"
                          }
                        >
                          {match.team2.player1.name}
                        </span>
                        {" & "}
                        <span
                          className={
                            match.team2.player2.gender === "male"
                              ? "text-blue-600"
                              : "text-pink-600"
                          }
                        >
                          {match.team2.player2.name}
                        </span>
                      </p>
                      <p className="text-sm text-gray-600">
                        평균 레벨: {match.team2.averageLevel}
                      </p>
                    </div>
                    <p className="text-sm text-gray-600">
                      매치 타입:{" "}
                      <span
                        className={`font-medium ${
                          match.matchType === "mixed"
                            ? "text-purple-600"
                            : match.matchType === "male"
                            ? "text-blue-600"
                            : "text-pink-600"
                        }`}
                      >
                        {match.matchType === "mixed"
                          ? "혼복"
                          : match.matchType === "male"
                          ? "남복"
                          : "여복"}
                      </span>
                    </p>
                    <p className="text-sm text-gray-600">
                      전체 평균 레벨: {match.averageLevel}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
