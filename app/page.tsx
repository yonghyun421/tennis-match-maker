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
    group: "terizz",
  });

  const handleAddPlayer = () => {
    if (newPlayer.name.trim()) {
      setPlayers([
        ...players,
        { ...newPlayer, id: `player-${players.length + 1}`, matchesPlayed: 0 },
      ]);
      setNewPlayer({ name: "", level: 3, gender: "male", group: "terizz" });
      setError("");
    }
  };

  const handleGenerateMatches = () => {
    const initialPlayers = players.map((p) => ({ ...p, matchesPlayed: 0 }));
    try {
      const generatedRounds = generateMatches(
        initialPlayers,
        matchType,
        matchType,
        numberOfCourts,
        numberOfRounds
      );
      const finalPlayerStateMap = new Map<string, number>();
      generatedRounds.forEach((round) => {
        round.matches.forEach((match) => {
          [
            match.team1.player1,
            match.team1.player2,
            match.team2.player1,
            match.team2.player2,
          ].forEach((p) => {
            finalPlayerStateMap.set(
              p.id,
              (finalPlayerStateMap.get(p.id) || 0) + 1
            );
          });
        });
      });
      setPlayers((prevPlayers) =>
        prevPlayers.map((p) => ({
          ...p,
          matchesPlayed: finalPlayerStateMap.get(p.id) || 0,
        }))
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
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <h1 className="text-4xl font-bold mb-8 text-gray-800 text-center">
          테니스 대진표 생성기
        </h1>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">
            플레이어 등록
          </h2>
          <div className="flex flex-wrap gap-3 mb-4 items-center">
            <input
              type="text"
              placeholder="이름"
              value={newPlayer.name}
              onChange={(e) =>
                setNewPlayer({ ...newPlayer, name: e.target.value })
              }
              className="text-black flex-1 min-w-[200px] border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
            <select
              value={newPlayer.level}
              onChange={(e) =>
                setNewPlayer({ ...newPlayer, level: Number(e.target.value) })
              }
              className="text-black border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
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
              className="text-black border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            >
              <option value="male">남성</option>
              <option value="female">여성</option>
            </select>

            <div className="flex items-center gap-4 border border-gray-200 p-2.5 rounded-lg">
              <span className="text-gray-600 text-sm">그룹:</span>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="group"
                  value="terizz"
                  checked={newPlayer.group === "terizz"}
                  onChange={(e) =>
                    setNewPlayer({
                      ...newPlayer,
                      group: e.target.value as "terizz" | "tenipang",
                    })
                  }
                  className="form-radio h-4 w-4 text-blue-600"
                />
                <span className="ml-2 text-black">테리쯔</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="group"
                  value="tenipang"
                  checked={newPlayer.group === "tenipang"}
                  onChange={(e) =>
                    setNewPlayer({
                      ...newPlayer,
                      group: e.target.value as "terizz" | "tenipang",
                    })
                  }
                  className="form-radio h-4 w-4 text-pink-600"
                />
                <span className="ml-2 text-black">테니팡</span>
              </label>
            </div>

            <button
              onClick={handleAddPlayer}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg transition-colors duration-200 font-medium"
            >
              추가
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">
            등록된 플레이어
          </h2>
          <ul className="grid grid-cols-2 gap-3">
            {players.map((player) => (
              <li
                key={player.id}
                className={`p-3 rounded-lg border-2 transition-all hover:shadow-md flex items-center ${
                  player.gender === "male"
                    ? "border-blue-200 hover:border-blue-400"
                    : "border-pink-200 hover:border-pink-400"
                }`}
              >
                <span
                  className={`inline-block w-3 h-3 rounded-full mr-2 flex-shrink-0 ${
                    player.group === "terizz" ? "bg-green-500" : "bg-yellow-400"
                  }`}
                ></span>
                <div>
                  <span
                    className={`font-medium ${
                      player.gender === "male"
                        ? "text-blue-700"
                        : "text-pink-700"
                    }`}
                  >
                    {player.name}
                  </span>
                  <span className="text-gray-600 text-sm ml-1">
                    (레벨 {player.level},{" "}
                    <span
                      className={
                        player.gender === "male"
                          ? "text-blue-600"
                          : "text-pink-600"
                      }
                    >
                      {player.gender === "male" ? "남성" : "여성"}
                    </span>
                    )
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">
            대진표 생성
          </h2>
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-3">
              <select
                value={matchType}
                onChange={(e) => setMatchType(e.target.value as MatchType)}
                className="text-black flex-1 min-w-[150px] border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              >
                <option value="mixed">혼복</option>
                <option value="male">남복</option>
                <option value="female">여복</option>
              </select>
              <select
                value={numberOfCourts}
                onChange={(e) => setNumberOfCourts(Number(e.target.value))}
                className="text-black flex-1 min-w-[150px] border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
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
                className="text-black flex-1 min-w-[150px] border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
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
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={players.length < 4}
            >
              대진표 생성
            </button>
            {error && (
              <p className="text-red-500 bg-red-50 p-3 rounded-lg border border-red-200">
                {error}
              </p>
            )}
          </div>
        </div>

        {rounds.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-6 text-gray-700">
              생성된 대진표
            </h2>

            <div className="mb-8 bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3 text-gray-600">
                플레이어별 게임 수
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {players.map((player) => {
                  const gameCount = player.matchesPlayed;
                  return (
                    <div
                      key={player.id}
                      className={`p-3 rounded-lg border ${
                        player.gender === "male"
                          ? "border-blue-200 bg-blue-50"
                          : "border-pink-200 bg-pink-50"
                      }`}
                    >
                      <span
                        className={`font-medium ${
                          player.gender === "male"
                            ? "text-blue-700"
                            : "text-pink-700"
                        }`}
                      >
                        {player.name}
                      </span>
                      <div className="text-sm text-gray-600 mt-1">
                        총 {gameCount}게임
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {rounds.map((round) => (
              <div key={round.roundNumber} className="mb-8 last:mb-0">
                <h3 className="text-xl font-semibold mb-4 text-gray-600">
                  회차 {round.roundNumber}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {round.matches.map((match) => (
                    <div
                      key={match.id}
                      className="border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-shadow"
                    >
                      <p className="font-semibold text-lg mb-3 text-gray-700">
                        코트 {match.court}
                      </p>
                      <div className="space-y-4">
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="font-semibold text-gray-700 mb-2">
                            팀 1
                            <span className="text-sm text-gray-600 font-normal ml-1">
                              (평균 레벨: {match.team1.averageLevel.toFixed(1)})
                            </span>
                          </p>
                          <p className="text-sm text-black">
                            <span
                              className={
                                match.team1.player1.gender === "male"
                                  ? "text-blue-600"
                                  : "text-pink-600"
                              }
                            >
                              <span
                                className={`inline-block w-2.5 h-2.5 rounded-full mr-1.5 ${
                                  match.team1.player1.group === "terizz"
                                    ? "bg-green-500"
                                    : "bg-yellow-400"
                                }`}
                              ></span>
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
                              <span
                                className={`inline-block w-2.5 h-2.5 rounded-full mr-1.5 ${
                                  match.team1.player2.group === "terizz"
                                    ? "bg-green-500"
                                    : "bg-yellow-400"
                                }`}
                              ></span>
                              {match.team1.player2.name}
                            </span>
                          </p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="font-semibold text-gray-700 mb-2">
                            팀 2
                            <span className="text-sm text-gray-600 font-normal ml-1">
                              (평균 레벨: {match.team2.averageLevel.toFixed(1)})
                            </span>
                          </p>
                          <p className="text-sm text-black">
                            <span
                              className={
                                match.team2.player1.gender === "male"
                                  ? "text-blue-600"
                                  : "text-pink-600"
                              }
                            >
                              <span
                                className={`inline-block w-2.5 h-2.5 rounded-full mr-1.5 ${
                                  match.team2.player1.group === "terizz"
                                    ? "bg-green-500"
                                    : "bg-yellow-400"
                                }`}
                              ></span>
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
                              <span
                                className={`inline-block w-2.5 h-2.5 rounded-full mr-1.5 ${
                                  match.team2.player2.group === "terizz"
                                    ? "bg-green-500"
                                    : "bg-yellow-400"
                                }`}
                              ></span>
                              {match.team2.player2.name}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-gray-100">
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
                        <p className="text-sm text-gray-600 mt-1">
                          전체 평균 레벨: {match.averageLevel.toFixed(1)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
