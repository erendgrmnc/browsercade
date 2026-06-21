import { useState } from "react";
import { ChessGame } from "./components/ChessGame";
import { OnlineChessGame } from "./components/online/OnlineChessGame";
import { SegmentedControl } from "@/shared/ui/SegmentedControl";

type Mode = "ai" | "online";

const MODES: { label: string; value: Mode }[] = [
  { label: "vs Computer", value: "ai" },
  { label: "Online", value: "online" },
];

/** The chess game module's entry point: a toggle between AI and online play. */
export default function ChessApp() {
  const [mode, setMode] = useState<Mode>("ai");

  return (
    <div className="flex flex-col gap-6">
      <SegmentedControl options={MODES} value={mode} onChange={setMode} />
      {mode === "ai" ? <ChessGame /> : <OnlineChessGame />}
    </div>
  );
}
