import React, { useState, useEffect } from 'react';
import buildsData from '../../data/builds.json';

// Experimental prototype component (neural/adaptive graph viz).
// The reagraph dependency is not part of the main project deps to keep
// the core calculator lean. This file uses a placeholder for the graph area
// so that full-tree typecheck (tsconfig.ui) succeeds without it.
// To enable the live graph in the future, `npm install reagraph` + restore
// the GraphCanvas usage (this file is not imported by the active ui/App.tsx).
interface BuildData {
 id: string | number;
 name: string;
 type?: string;
 tier?: string | number;
 image?: string;
 stats?: Record<string, string | number>;
 attachments?: Record<string, string | number>;
}

const LoadoutPanel: React.FC = () => {
 const [layoutMode, setLayoutMode] = useState<'forceDirected2d' | 'forceDirected3d'>('forceDirected3d');
 const [showClusters, setShowClusters] = useState(true);
 const [selectedBuild, setSelectedBuild] = useState(0);
 const [simulationProgress, setSimulationProgress] = useState(0);
 const [isSimulating, setIsSimulating] = useState(false);

 // Real JSON data binding for builds (from video prototype)
 const builds = buildsData as any[];

 // Current build
 const currentBuild = builds[selectedBuild];

 // Animation for simulation flow (Combat Simulator style)
 useEffect(() => {
  let interval: NodeJS.Timeout;
  if (isSimulating) {
   interval = setInterval(() => {
    setSimulationProgress((prev) => {
     if (prev >= 100) {
      setIsSimulating(false);
      return 100;
     }
     return prev + 2;
    });
   }, 80);
  }
  return () => clearInterval(interval);
 }, [isSimulating]);

 const nodes = [
  // Input Layer (fingerprint-like)
  { id: 'input1', label: 'Sensory Input', fill: '#03DDF7', group: 'input' },
  { id: 'input2', label: 'Context Data', fill: '#03DDF7', group: 'input' },
  
  // Hidden Layers (more depth for adaptive intelligence)
  { id: 'hidden1', label: 'Perception Layer', fill: '#5E38D7', group: 'perception' },
  { id: 'hidden2', label: 'Resonance Hub', fill: '#9A4DF1', group: 'resonance' },
  { id: 'hidden3', label: 'Memory Core', fill: '#7C4DFF', group: 'memory' },
  { id: 'hidden4', label: 'Decision Engine', fill: '#08A2EB', group: 'decision' },
  
  // Output & Human Feedback
  { id: 'output', label: 'OHMM Action', fill: '#00FFAA', group: 'output' },
  { id: 'human', label: 'Human Feedback', fill: '#03DDF7', group: 'human' },
 ];

 const edges = [
  { id: 'e1', source: 'input1', target: 'hidden1', label: 'Raw Data' },
  { id: 'e2', source: 'input2', target: 'hidden1', label: 'Context' },
  { id: 'e3', source: 'hidden1', target: 'hidden2', label: 'Pattern Match' },
  { id: 'e4', source: 'hidden2', target: 'hidden3', label: 'Adaptive Recall' },
  { id: 'e5', source: 'hidden3', target: 'hidden4', label: 'Inference' },
  { id: 'e6', source: 'hidden4', target: 'output', label: 'Execute' },
  { id: 'e7', source: 'human', target: 'hidden2', label: 'Reinforce' },
  { id: 'e8', source: 'hidden3', target: 'human', label: 'Insight' },
  { id: 'e9', source: 'hidden1', target: 'hidden4', label: 'Shortcut' },
 ];

 return (
  <div className="loadout-panel bg-ohai-dark text-ohai-text p-6 rounded-xl border border-ohai-border shadow-2xl max-w-7xl mx-auto">
   {/* Header matching video */}
   <div className="flex justify-between items-center mb-6 border-b border-ohai-border pb-4">
    <h1 className="text-3xl font-bold text-ohai-primary flex items-center gap-3">
     Build Forge <span className="text-ohai-accent">🛠️</span>
    </h1>
    <div className="flex gap-3">
     <button 
      onClick={() => setIsSimulating(!isSimulating)}
      className="px-6 py-2 bg-ohai-primary hover:bg-cyan-400 text-black font-semibold rounded-lg transition-all flex items-center gap-2"
      disabled={isSimulating}
     >
      {isSimulating ? 'SIMULATING...' : 'RUN COMBAT SIM'}
     </button>
     <button 
      onClick={() => setLayoutMode(layoutMode === 'forceDirected3d' ? 'forceDirected2d' : 'forceDirected3d')}
      className="px-4 py-2 bg-ohai-card border border-ohai-border rounded-lg hover:glow-primary transition-all"
     >
      {layoutMode === 'forceDirected3d' ? '2D' : '3D'} GRAPH
     </button>
    </div>
   </div>

   <div className="grid grid-cols-12 gap-6">
    {/* Left: Build Selection & Weapon (JSON bound) */}
    <div className="col-span-5 space-y-6">
     <div className="bg-ohai-card p-5 rounded-xl border border-ohai-border">
      <label className="block text-sm text-ohai-text/70 mb-3">YOUR BUILD</label>
      <select 
       value={selectedBuild}
       onChange={(e) => setSelectedBuild(parseInt(e.target.value))}
       className="w-full bg-[#1F1F1F] border border-ohai-border text-ohai-text rounded-lg px-4 py-3 mb-4 focus:outline-none focus:border-ohai-accent"
      >
       {builds.map((build, idx) => (
        <option key={build.id} value={idx}>{build.name}</option>
       ))}
      </select>

      <div className="flex gap-4">
       <img 
        src={currentBuild.image} 
        alt={currentBuild.name}
        className="w-32 h-24 object-cover rounded border border-ohai-border"
       />
       <div>
        <div className="font-mono text-ohai-primary text-xl">{currentBuild.name}</div>
        <div className="text-sm text-ohai-text/70">{currentBuild.type} • {currentBuild.tier}</div>
        <div className="mt-2 text-xs flex gap-4">
         <div>Power Surge: <span className="text-emerald-400">{currentBuild.stats.powerSurge}</span></div>
         <div>Food Amp: <span className="text-emerald-400">{currentBuild.stats.foodAmp}</span></div>
        </div>
       </div>
      </div>
     </div>

     {/* Attachments - JSON bound */}
     <div className="bg-ohai-card p-5 rounded-xl border border-ohai-border">
      <h3 className="font-semibold mb-4">Gear, Mods &amp; Attachments</h3>
      {Object.entries(currentBuild.attachments || {}).map(([key, value]) => (
       <div key={key} className="flex justify-between py-2 border-b border-ohai-border last:border-0 text-sm">
        <span className="capitalize text-ohai-text/70">{key}</span>
        <span className="text-ohai-text">{String(value ?? '')}</span>
       </div>
      ))}
     </div>
    </div>

    {/* Center: Experimental Neural Graph Placeholder (reagraph not in main deps) */}
    <div className="col-span-7">
     <div className="bg-black border border-ohai-border rounded-xl overflow-hidden h-[520px] relative glow-primary mb-4 flex items-center justify-center">
      <div className="text-center p-8 max-w-md">
       <div className="text-4xl mb-4 opacity-60">🧠</div>
       <div className="font-semibold text-ohai-primary mb-2">Adaptive Neural Graph (Prototype)</div>
       <div className="text-sm text-ohai-text/70 mb-4">
        This area previously rendered a live force-directed graph using reagraph for build "signal flow".
        The dependency is intentionally not installed in the core project to keep the calculator bundle lean and typecheck clean.
       </div>
       <div className="text-xs text-ohai-text/50 border border-ohai-border rounded p-2">
        Nodes represent layers (Perception / Resonance / Memory / Decision). Restore by installing reagraph and restoring GraphCanvas usage in this experimental file (not imported by active UI).
       </div>

       {/* Minimal static visual representation of the intended graph */}
       <div className="mt-6 grid grid-cols-3 gap-2 text-[10px] opacity-70">
        <div className="border border-[#03DDF7]/50 rounded p-1">Sensory</div>
        <div className="border border-[#5E38D7]/50 rounded p-1 col-span-2">Perception → Resonance</div>
        <div className="border border-[#9A4DF1]/50 rounded p-1">Memory</div>
        <div className="border border-[#08A2EB]/50 rounded p-1">Decision</div>
        <div className="border border-[#00FFAA]/50 rounded p-1 col-span-1">OHAI Action</div>
       </div>
      </div>

      {/* Overlay Simulation Progress (kept functional) */}
      {isSimulating && (
       <div className="absolute bottom-4 left-4 right-4 bg-black/80 p-3 rounded border border-ohai-primary">
        <div className="flex justify-between text-xs mb-1">
         <span>SIMULATION FLOW</span>
         <span>{simulationProgress}%</span>
        </div>
        <div className="h-1 bg-ohai-border rounded overflow-hidden">
         <div 
          className="h-full bg-gradient-to-r from-ohai-primary to-ohai-accent transition-all duration-200"
          style={{ width: `${simulationProgress}%` }}
         />
        </div>
        <div className="text-[10px] text-ohai-text/60 mt-1">PvP Mitigation • DPS Forecast • Adaptive Resonance</div>
       </div>
      )}
     </div>

     {/* Simulation Controls */}
     <div className="flex gap-3 text-sm">
      <button 
       onClick={() => setShowClusters(!showClusters)}
       className="flex-1 py-3 bg-ohai-card border border-ohai-border hover:border-ohai-accent rounded-lg transition-all"
      >
       {showClusters ? 'Hide' : 'Show'} Clusters
      </button>
      <button 
       onClick={() => setSimulationProgress(0)}
       className="flex-1 py-3 bg-ohai-card border border-ohai-border hover:border-ohai-accent rounded-lg transition-all"
      >
       RESET SIM
      </button>
     </div>
    </div>
   </div>
  </div>
 );
};

export default LoadoutPanel;
