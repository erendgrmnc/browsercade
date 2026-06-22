import { useState } from "react";
import { ChessGame } from "./components/ChessGame";
import { OnlineChessGame } from "./components/online/OnlineChessGame";
import { ModeSelect, type ModeOption } from "@/shared/ui/ModeSelect";
import { CpuIcon, WifiIcon } from "@/shared/ui/icons";

type Mode = "ai" | "online";

const MODES: ModeOption<Mode>[] = [
  { label: "vs Computer", value: "ai", icon: <CpuIcon /> },
  { label: "Online", value: "online", icon: <WifiIcon /> },
];

/** The chess game module's entry point: a toggle between AI and online play. */
export default function ChessApp() {
  const [mode, setMode] = useState<Mode>("ai");

  return (
    <div className="flex flex-col gap-6">
      <ModeSelect options={MODES} value={mode} onChange={setMode} />
      <div key={mode} className="bc-fade">
        {mode === "ai" ? <ChessGame /> : <OnlineChessGame />}
      </div>
    </div>
  );
}
