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
  const [result, setResult] = useState("No spin yet.");
  const [selectedPrize, setSelectedPrize] = useState(null);
  const [prizes, setPrizes] = useState([]);
  const [history, setHistory] = useState([]);
  const [loadingPrizes, setLoadingPrizes] = useState(true);

  const loadPrizes = async () => {
    setLoadingPrizes(true);

    const { data, error } = await supabase
      .from("prizes")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Supabase prizes load error:", error.message);
      setResult(`Prize load failed: ${error.message}`);
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

  const saveSpinResult = async (prize) => {
    const { error } = await supabase
      .from("spin_results")
      .insert([{ prize: prize.name }]);

    if (error) {
      console.error("Supabase insert error:", error.message);
      setResult(`Save failed: ${error.message}`);
      return;
    }

    setResult(`You won: ${prize.name} (saved to database)`);
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

        {loadingPrizes ? (
          <p className="mb-6 text-gray-600">Loading prizes...</p>
        ) : prizes.length === 0 ? (
          <p className="mb-6 text-red-600">No active prizes found in Supabase.</p>
        ) : (
          <Wheel
            mustStartSpinning={mustSpin}
            prizeNumber={prizeNumber}
            data={wheelData}
            backgroundColors={backgroundColors}
            textColors={["#ffffff"]}
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

        <div className="mt-6 w-full bg-gray-100 border rounded-xl p-4 text-center">
          <p className="text-lg font-semibold text-gray-800">{result}</p>
        </div>

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
                  <span className="font-medium">{item.prize}</span>
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