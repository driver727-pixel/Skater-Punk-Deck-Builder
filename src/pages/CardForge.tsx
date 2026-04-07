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

  const PillSection = ({ label, current, options, field }: { label: string, current: string, options: string[], field: keyof CardPrompts }) => (
    <section className="mb-6">
      <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button 
            key={opt} 
            onClick={() => set(field, opt as any)} 
            className={`px-3 py-1 text-sm rounded-full border transition-all ${current === opt ? 'bg-yellow-500 text-black border-yellow-500 font-bold' : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}
          >
            {opt}
          </button>
        ))}
      </div>
    </section>
  );

  return (
    <div className="page p-8 max-w-6xl mx-auto">
      <h1 className="text-5xl font-black italic tracking-tighter mb-12 border-b-4 border-yellow-500 inline-block">CARD FORGE</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        <div className="controls bg-gray-900/50 p-8 rounded-2xl border border-gray-800">
          <PillSection label="Archetype" current={prompts.archetype} options={ARCHETYPES} field="archetype" />
          <PillSection label="Rarity" current={prompts.rarity} options={RARITIES} field="rarity" />
          <PillSection label="Style" current={prompts.style} options={STYLES} field="style" />
          <PillSection label="Vibe" current={prompts.vibe} options={VIBES} field="vibe" />
          <PillSection label="District" current={prompts.district} options={DISTRICTS} field="district" />
          
          <button 
            onClick={() => setGenerated(generateCard(prompts))} 
            className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-black py-5 rounded-xl text-xl mt-8 shadow-[0_0_20px_rgba(234,179,8,0.3)] transition-all active:scale-95"
          >
            ⚡ FORGE COURIER CARD
          </button>
        </div>

        <div className="preview flex items-start justify-center pt-10">
          {generated ? (
            <div className="sticky top-8">
              <CardDisplay card={generated} />
            </div>
          ) : (
            <div className="text-center text-gray-700 py-20 border-2 border-dashed border-gray-800 rounded-3xl w-full">
              <p className="text-6xl mb-4">🛹</p>
              <p className="font-mono uppercase tracking-[0.2em] text-xs">Select prompts to initialize</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
