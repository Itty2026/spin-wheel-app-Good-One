"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { supabase } from "../lib/supabase";

const Wheel = dynamic(
  () => import("react-custom-roulette").then((mod) => mod.Wheel),
  { ssr: false }
);
 function truncateText(text, maxLength = 22) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 1) + "…";
}

function fireConfetti() {
  import("canvas-confetti").then((mod) => {
    const confetti = mod.default;
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 },
      colors: ["#B8304A", "#1E4D6B", "#C9A84C", "#7FA8B8"] });
    setTimeout(() => {
      confetti({ particleCount: 60, angle: 60, spread: 60, origin: { x: 0 },
        colors: ["#B8304A", "#1E4D6B", "#C9A84C"] });
    }, 200);
    setTimeout(() => {
      confetti({ particleCount: 60, angle: 120, spread: 60, origin: { x: 1 },
        colors: ["#B8304A", "#1E4D6B", "#C9A84C"] });
    }, 400);
    setTimeout(() => {
      confetti({ particleCount: 80, spread: 120, origin: { y: 0.3 },
        colors: ["#B8304A", "#1E4D6B", "#C9A84C", "#7FA8B8"] });
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
    if (error) { setLoadingPrizes(false); return; }
    setPrizes(data || []);
    setLoadingPrizes(false);
  };

  const loadHistory = async () => {
    const { data, error } = await supabase
      .from("spin_results")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);
    if (error) return;
    setHistory(data || []);
  };

  useEffect(() => {
    loadPrizes();
    loadHistory();
  }, []);

  const handleNameSubmit = async () => {
    const trimmed = userName.trim();
    if (!trimmed) { setNameError("Please enter your name."); return; }
    setCheckingName(true);
    setNameError("");
    const { data, error } = await supabase
      .from("spin_results")
      .select("id")
      .ilike("winner_name", trimmed)
      .limit(1);
    setCheckingName(false);
    if (error) { setNameError("Error checking name. Please try again."); return; }
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
    if (error) { console.error("Supabase insert error:", error.message); return; }
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

  const wheelData = prizes.map((prize) => ({
    option: truncateText(prize.name),
  }));

  const backgroundColors =
    prizes.length > 0 ? prizes.map((prize) => prize.color) : ["#1E4D6B"];

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: "linear-gradient(135deg, #f5f0eb 0%, #e8f0f5 50%, #f5f0eb 100%)" }}>

      {/* Win Modal */}
      {showWinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-10 max-w-sm w-full text-center shadow-2xl"
            style={{ border: "3px solid #C9A84C" }}>
            <div className="text-7xl mb-4">🎉</div>
            <h2 className="text-3xl font-extrabold mb-2"
              style={{ color: "#B8304A" }}>
              You Won!
            </h2>
            <p className="text-lg text-gray-600 mb-1">
              Congratulations,{" "}
              <span className="font-bold" style={{ color: "#1E4D6B" }}>
                {userName.trim()}
              </span>!
            </p>
            <div className="my-4 rounded-2xl p-4"
              style={{ background: "#f5f0eb", border: "2px solid #C9A84C" }}>
              <p className="text-2xl font-extrabold" style={{ color: "#1E4D6B" }}>
                {winPrize}
              </p>
            </div>
            <button
              onClick={() => setShowWinModal(false)}
              className="mt-2 text-white px-8 py-3 rounded-xl font-bold text-lg w-full transition hover:opacity-90"
              style={{ background: "linear-gradient(to right, #B8304A, #1E4D6B)" }}
            >
              🎊 Awesome!
            </button>
          </div>
        </div>
      )}

      <div className="bg-white shadow-2xl rounded-3xl p-8 max-w-xl w-full flex flex-col items-center"
        style={{ border: "2px solid #C9A84C" }}>

        {/* Logo */}
        <img
          src="/spin-logo.png"
          alt="Spin the Wheel - CM Incentive Program"
          className="w-80 mb-4 object-contain"
        />

        <p className="mb-6 text-center text-sm font-medium" style={{ color: "#7FA8B8" }}>
          One spin per person — good luck! 🎉
        </p>

        {/* Name Entry */}
        {!nameSubmitted ? (
          <div className="w-full mb-4">
            <p className="text-lg font-semibold mb-3 text-center" style={{ color: "#1E4D6B" }}>
              Enter your name to spin:
            </p>
            <input
              type="text"
              placeholder="Your full name"
              value={userName}
              onChange={(e) => { setUserName(e.target.value); setNameError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleNameSubmit()}
              className="w-full rounded-xl p-3 mb-3 text-center text-lg focus:outline-none transition"
              style={{ border: "2px solid #7FA8B8" }}
            />
            {nameError && (
              <p className="text-center mb-3 font-medium rounded-xl p-2"
                style={{ color: "#B8304A", background: "#fdf0f2" }}>
                {nameError}
              </p>
            )}
            <button
              onClick={handleNameSubmit}
              disabled={checkingName}
              className="w-full text-white rounded-xl py-3 font-bold text-lg shadow-md transition hover:opacity-90 disabled:opacity-50"
              style={{ background: "linear-gradient(to right, #1E4D6B, #B8304A)" }}
            >
              {checkingName ? "Checking..." : "Let's Go! 🎡"}
            </button>
          </div>
        ) : (
          <>
            <p className="text-base mb-4 text-center" style={{ color: "#7FA8B8" }}>
              Good luck,{" "}
              <span className="font-bold" style={{ color: "#1E4D6B" }}>
                {userName.trim()}
              </span>! 🎉
            </p>

            {loadingPrizes ? (
              <p className="mb-6 text-gray-600">Loading prizes...</p>
            ) : prizes.length === 0 ? (
              <p className="mb-6" style={{ color: "#B8304A" }}>No active prizes found.</p>
            ) : (
              <div className="relative inline-flex items-center justify-center">
                <Wheel
                  mustStartSpinning={mustSpin}
                  prizeNumber={prizeNumber}
                  data={wheelData}
                  backgroundColors={backgroundColors}
                  textColors={["#ffffff"]}
                  fontSize={9}
                  outerBorderWidth={5}
                  outerBorderColor="#1E4D6B"
                  innerRadius={10}
                  innerBorderWidth={3}
                  innerBorderColor="#C9A84C"
                  radiusLineWidth={1}
                  radiusLineColor="rgba(255,255,255,0.4)"
                  textDistance={68}
                  spinDuration={0.9}
                  onStopSpinning={async () => {
                    setMustSpin(false);
                    if (selectedPrize) await saveSpinResult(selectedPrize);
                  }}
                />
              </div>
            )}

            <button
              onClick={handleSpinClick}
              disabled={mustSpin || loadingPrizes || prizes.length === 0}
              className="mt-6 px-12 py-4 text-white rounded-2xl font-extrabold text-xl shadow-xl transition hover:opacity-90 disabled:opacity-50 disabled:shadow-none"
              style={{
                background: mustSpin
                  ? "#C4BFB5"
                  : "linear-gradient(to right, #B8304A, #1E4D6B)",
                letterSpacing: "0.05em"
              }}
            >
              {mustSpin ? "🌀 Spinning..." : "✨ SPIN! ✨"}
            </button>

            {result && !showWinModal && (
              <div className="mt-4 w-full rounded-xl p-3 text-center"
                style={{ background: "#f5f0eb", border: "1px solid #C9A84C" }}>
                <p className="text-base font-semibold" style={{ color: "#1E4D6B" }}>
                  {result}
                </p>
              </div>
            )}
          </>
        )}

        {/* Recent Winners */}
        <div className="mt-8 w-full">
          <h2 className="text-xl font-bold mb-3" style={{ color: "#1E4D6B" }}>
            🏆 Recent Winners
          </h2>
          {history.length === 0 ? (
            <p className="text-center py-4" style={{ color: "#C4BFB5" }}>
              No winners yet — be the first!
            </p>
          ) : (
            <ul className="space-y-2">
              {history.map((item) => (
                <li
                  key={item.id}
                  className="rounded-xl p-3 flex justify-between gap-4 items-center"
                  style={{ background: "#f5f0eb", border: "1px solid #C9A84C" }}
                >
                  <span className="font-medium text-sm" style={{ color: "#1E4D6B" }}>
                    🏅{" "}
                    {item.winner_name && (
                      <span className="font-bold" style={{ color: "#B8304A" }}>
                        {item.winner_name}
                      </span>
                    )}
                    {item.winner_name ? " — " : ""}
                    {item.prize}
                  </span>
                  <span className="text-xs whitespace-nowrap" style={{ color: "#7FA8B8" }}>
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
