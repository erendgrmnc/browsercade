import { Routes, Route } from "react-router-dom";
import { Home } from "@/arcade/Home";
import { GameShell } from "@/arcade/GameShell";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/play/:id" element={<GameShell />} />
      <Route path="*" element={<Home />} />
    </Routes>
  );
}
