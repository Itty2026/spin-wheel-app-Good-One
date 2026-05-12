"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { supabase } from "../lib/supabase";

const Wheel = dynamic(
  () => import("react-custom-roulette").then((mod) => mod.Wheel),
  { ssr: false }
);

// Truncates long prize names for the wheel display only
function truncateText(text, maxLength = 25) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 1) + "…";
}

function fireConfetti() {
  import("canvas-confetti").then((mod) => {
    const confetti = mod.default;
    // Center burst
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    // Left burst
    setTimeout(() => {
      confetti({ particleCount: 60, angle: 60, spread: 60, origin: { x: 0 } });
    }, 200);
    // Right burst
    setTimeout(() => {
      confetti({ particleCount: 60, angle: 120, spread: 60, origin: { x: 1 } });
    }, 400);
    // Final top shower
    setTimeout(() => {
      confetti({ particleCount: 80, spread: 120, origin: { y: 0.3 } });
    }, 700);
  });
}

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
  const [showWinModal, setShowWinModal] = useState(false);
  const [winPrize, setWinPrize] = useState("");

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
      return;
    }

    setWinPrize(prize.name);
    setShowWinModal(true);
    fireConfetti();
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

  // Truncated labels for wheel display only — full names saved to DB
  const wheelData = prizes.map((prize) => ({
    option: truncateText(prize.name),
  }));

  const backgroundColors =
    prizes.length > 0 ? prizes.map((prize) => prize.color) : ["#7c3aed"];

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-pink-100 flex flex-col items-center justify-center p-6">

      {/* Win Modal */}
      {showWinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-10 max-w-sm w-full text-center shadow-2xl">
            <div className="text-7xl mb-4">🎉</div>
            <h2 className="text-3xl font-extrabold text-purple-700 mb-2">
              You Won!
            </h2>
            <p className="text-lg text-gray-600 mb-1">
              Congratulations,{" "}
              <span className="font-bold text-gray-800">{userName.trim()}</span>!
            </p>
            <div className="my-4 bg-purple-50 border-2 border-purple-200 rounded-2xl p-4">
              <p className="text-2xl font-extrabold text-purple-700">
                {winPrize}
              </p>
            </div>
            <button
              onClick={() => setShowWinModal(false)}
              className="mt-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white px-8 py-3 rounded-xl font-bold hover:opacity-90 transition text-lg w-full"
            >
              🎊 Awesome!
            </button>
          </div>
        </div>
      )}

      <div className="bg-white shadow-2xl rounded-3xl p-8 max-w-xl w-full flex flex-col items-center">
        <div className="text-5xl mb-2">🎡</div>
        <h1 className="text-4xl font-extrabold mb-1 text-purple-700 text-center">
          Spin to Win!
        </h1>
        <p className="text-gray-400 mb-6 text-center text-sm">
          One spin per person — good luck!
        </p>

        {/* Name Entry */}
        {!nameSubmitted ? (
          <div className="w-full mb-4">
            <p className="text-lg font-semibold mb-3 text-center text-gray-700">
              Enter your name to spin:
            </p>
            <input
              type="text"
              placeholder="Your full name"
              value={userName}
              onChange={(e) => {
                setUserName(e.target.value);
                setNameError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleNameSubmit()}
              className="w-full border-2 border-purple-300 rounded-xl p-3 mb-3 text-center text-lg focus:outline-none focus:border-purple-500 transition"
            />
            {nameError && (
              <p className="text-red-600 text-center mb-3 font-medium bg-red-50 rounded-xl p-2">
                {nameError}
              </p>
            )}
            <button
              onClick={handleNameSubmit}
              disabled={checkingName}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-xl py-3 font-bold hover:opacity-90 transition disabled:opacity-50 text-lg shadow-md"
            >
              {checkingName ? "Checking..." : "Let's Go! 🎡"}
            </button>
          </div>
        ) : (
          <>
            <p className="text-base text-gray-500 mb-4 text-center">
              Good luck,{" "}
              <span className="font-bold text-purple-700">{userName.trim()}</span>! 🎉
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
                fontSize={9}
                outerBorderWidth={4}
                outerBorderColor="#7c3aed"
                innerRadius={10}
                innerBorderWidth={2}
                innerBorderColor="#ede9fe"
                radiusLineWidth={1}
                radiusLineColor="rgba(255,255,255,0.5)"
                textDistance={68}
                spinDuration={0.9}
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
              className="mt-6 px-12 py-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-2xl font-extrabold text-xl hover:opacity-90 transition shadow-xl disabled:from-gray-400 disabled:to-gray-400 disabled:shadow-none"
              style={{ letterSpacing: "0.05em" }}
            >
              {mustSpin ? "🌀 Spinning..." : "✨ SPIN! ✨"}
            </button>

            {result && !showWinModal && (
              <div className="mt-4 w-full bg-purple-50 border border-purple-200 rounded-xl p-3 text-center">
                <p className="text-base font-semibold text-purple-800">{result}</p>
              </div>
            )}
          </>
        )}

        {/* Recent Winners */}
        <div className="mt-8 w-full">
          <h2 className="text-xl font-bold mb-3 text-gray-700">🏆 Recent Winners</h2>
          {history.length === 0 ? (
            <p className="text-gray-400 text-center py-4">
              No winners yet — be the first!
            </p>
          ) : (
             <ul className="space-y-2">
              {history.map((item) => (
                <li
                  key={item.id}
                  className="border border-purple-100 rounded-xl p-3 bg-gradient-to-r from-purple-50 to-blue-50 flex justify-between gap-4 items-center"
                >
                  <span className="font-medium text-gray-800 text-sm">
                    🏅{" "}
                    {item.winner_name && (
                      <span className="text-purple-700 font-bold">
                        {item.winner_name}
                      </span>
                    )}
                    {item.winner_name ? " — " : ""}
                    {item.prize}
                  </span>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {new Date(item.created_at).toLocaleDateString()}
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
