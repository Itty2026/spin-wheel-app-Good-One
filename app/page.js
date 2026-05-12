"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { supabase } from "../lib/supabase";

const Wheel = dynamic(
  () => import("react-custom-roulette").then((mod) => mod.Wheel),
  { ssr: false }
);

export default function Home() {
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);
  const [result, setResult] = useState("");
  const [selectedPrize, setSelectedPrize] = useState(null);
  const [prizes, setPrizes] = useState([]);
  const [history, setHistory] = useState([]);
  const [loadingPrizes, setLoadingPrizes] = useState(true);
  const [userName, setUserName] = useState("");
  const [nameSubmitted, setNameSubmitted] = useState(false);
  const [checkingName, setCheckingName] = useState(false);
  const [nameError, setNameError] = useState("");

  const loadPrizes = async () => {
    setLoadingPrizes(true);
    const { data, error } = await supabase
      .from("prizes")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Supabase prizes load error:", error.message);
      setLoadingPrizes(false);
      return;
    }

    setPrizes(data || []);
    setLoadingPrizes(false);
  };

  const loadHistory = async () => {
    const { data, error } = await supabase
      .from("spin_results")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Supabase history load error:", error.message);
      return;
    }

    setHistory(data || []);
  };

  useEffect(() => {
    loadPrizes();
    loadHistory();
  }, []);

  const handleNameSubmit = async () => {
    const trimmed = userName.trim();
    if (!trimmed) {
      setNameError("Please enter your name.");
      return;
    }

    setCheckingName(true);
    setNameError("");

    // Check if this name has already spun
    const { data, error } = await supabase
      .from("spin_results")
      .select("id")
      .ilike("winner_name", trimmed)
      .limit(1);

    setCheckingName(false);

    if (error) {
      setNameError("Error checking name. Please try again.");
      return;
    }

    if (data && data.length > 0) {
      setNameError(`"${trimmed}" has already spun the wheel!`);
      return;
    }

    setNameSubmitted(true);
  };

  const saveSpinResult = async (prize) => {
    const { error } = await supabase
      .from("spin_results")
      .insert([{ prize: prize.name, winner_name: userName.trim() }]);

    if (error) {
      console.error("Supabase insert error:", error.message);
      setResult(`Save failed: ${error.message}`);
      return;
    }

    setResult(`🎉 ${userName.trim()} won: ${prize.name}!`);
    loadHistory();
  };

  const handleSpinClick = () => {
    if (mustSpin || prizes.length === 0) return;

    const newPrizeNumber = Math.floor(Math.random() * prizes.length);
    const winningPrize = prizes[newPrizeNumber];

    setPrizeNumber(newPrizeNumber);
    setSelectedPrize(winningPrize);
    setResult("Spinning...");
    setMustSpin(true);
  };

  const wheelData = prizes.map((prize) => ({
    option: prize.name,
  }));

  const backgroundColors =
    prizes.length > 0 ? prizes.map((prize) => prize.color) : ["#3b82f6"];

  return (
    <main className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
      <div className="bg-white shadow-xl rounded-2xl p-8 max-w-xl w-full flex flex-col items-center">
        <h1 className="text-4xl font-bold mb-6">Spin Wheel App</h1>

        {/* Name Entry Screen */}
        {!nameSubmitted ? (
          <div className="w-full mb-6">
            <p className="text-lg font-semibold mb-3 text-center">
              Enter your name to spin:
            </p>
            <input
              type="text"
              placeholder="Your name"
              value={userName}
              onChange={(e) => {
                setUserName(e.target.value);
                setNameError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleNameSubmit()}
              className="w-full border rounded-lg p-3 mb-3 text-center text-lg"
            />
            {nameError && (
              <p className="text-red-600 text-center mb-3">{nameError}</p>
            )}
            <button
              onClick={handleNameSubmit}
              disabled={checkingName}
              className="w-full bg-blue-600 text-white rounded-xl py-3 font-semibold hover:bg-blue-700 transition disabled:bg-gray-400"
            >
              {checkingName ? "Checking..." : "Continue"}
            </button>
          </div>
        ) : (
          <>
            <p className="text-lg text-gray-600 mb-4">
              Good luck,{" "}
              <span className="font-bold">{userName.trim()}</span>! 🎉
            </p>

            {loadingPrizes ? (
              <p className="mb-6 text-gray-600">Loading prizes...</p>
            ) : prizes.length === 0 ? (
              <p className="mb-6 text-red-600">No active prizes found.</p>
            ) : (
              <Wheel
                mustStartSpinning={mustSpin}
                prizeNumber={prizeNumber}
                data={wheelData}
                backgroundColors={backgroundColors}
                textColors={["#ffffff"]}
                fontSize={14}
                outerBorderWidth={2}
                innerRadius={0}
                innerBorderWidth={0}
                radiusLineWidth={1}
                textDistance={60}
                onStopSpinning={async () => {
                  setMustSpin(false);
                  if (selectedPrize) {
                    await saveSpinResult(selectedPrize);
                  }
                }}
              />
            )}

            <button
              onClick={handleSpinClick}
              disabled={mustSpin || loadingPrizes || prizes.length === 0}
              className="mt-8 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition disabled:bg-gray-400"
            >
              {mustSpin ? "Spinning..." : "Spin"}
            </button>

            {result && (
              <div className="mt-6 w-full bg-gray-100 border rounded-xl p-4 text-center">
                <p className="text-lg font-semibold text-gray-800">{result}</p>
              </div>
            )}
          </>
        )}

        {/* Recent Results */}
        <div className="mt-8 w-full">
          <h2 className="text-2xl font-bold mb-4">Recent Results</h2>
          {history.length === 0 ? (
            <p className="text-gray-600">No saved results yet.</p>
          ) : (
            <ul className="space-y-2">
              {history.map((item) => (
                <li
                  key={item.id}
                  className="border rounded-lg p-3 bg-gray-50 flex justify-between gap-4"
                >
                  <span className="font-medium">
                    {item.winner_name ? `${item.winner_name} — ` : ""}
                    {item.prize}
                  </span>
                  <span className="text-sm text-gray-500">
                    {new Date(item.created_at).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
}
