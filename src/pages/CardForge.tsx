import { useState } from "react";
import { CardPrompts, CardPayload, Archetype, Rarity, Style, Vibe, District } from "../lib/types";
import { generateCard } from "../lib/generator";
import { CardDisplay } from "../components/CardDisplay";

const ARCHETYPES: Archetype[] = ["Ninja", "Punk Rocker", "Ex Military", "Hacker", "Chef", "Olympic", "Fash"];
const RARITIES: Rarity[] = ["Punch Skater", "Apprentice", "Master", "Rare", "Legendary"];
const STYLES: Style[] = ["Corporate", "Street", "Off-grid", "Military", "Union"];
const VIBES: Vibe[] = ["Grunge", "Neon", "Chrome", "Plastic", "Recycled"];
const DISTRICTS: District[] = ["Airaway", "Nightshade", "Batteryville", "The Grid", "The Forest"];

export function CardForge() {
  const [prompts, setPrompts] = useState<CardPrompts>({
    archetype: "Ninja", rarity: "Punch Skater", style: "Street", 
    vibe: "Grunge", district: "Nightshade", accentColor: "#00ff88", stamina: 5
  });
  const [generated, setGenerated] = useState<CardPayload | null>(null);

  const set = <K extends keyof CardPrompts>(key: K, val: CardPrompts[K]) => 
    setPrompts((p) => ({ ...p, [key]: val }));

  const handleGenerate = () => {
    setGenerated(generateCard(prompts));
  };

  return (
    <div className="page p-8">
      <h1 className="text-4xl font-black mb-8">CARD FORGE</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <section>
            <label className="block text-sm font-bold mb-2">Archetype</label>
            <div className="flex flex-wrap gap-2">
              {ARCHETYPES.map(a => (
                <button key={a} onClick={() => set("archetype", a)} className={`px-3 py-1 rounded-full border ${prompts.archetype === a ? 'bg-blue-600 border-blue-600' : 'border-gray-600'}`}>{a}</button>
              ))}
            </div>
          </section>
          {/* Repeat similar sections for Rarity, Style, Vibe, District... */}
          
          <button onClick={handleGenerate} className="w-full bg-yellow-500 text-black font-bold py-4 rounded">⚡ FORGE CARD</button>
        </div>

        <div className="preview">
          {generated && <CardDisplay card={generated} />}
        </div>
      </div>
    </div>
  );
}
