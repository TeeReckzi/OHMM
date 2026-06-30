import React, { useState } from 'react';
import { Calculator, ChevronDown, ChevronRight, Crosshair, Zap, Gauge, Target, Eye, Info } from 'lucide-react';
import type { CalculationInput } from '../formulaBridge';
import type { CombatOutput } from '../combatOutput';

interface ScalerEngineProps {
 calcInput: CalculationInput;
 combatOutput: CombatOutput;
 formulaDamage?: number;
 formulaMultipliers: Array<{ name: string; multiplier: number; category?: string }>;
 totalMult: number;
 effectiveDmg?: number;
 dps?: number;
}

function FormulaTerminal({ formulaDamage, formulaMultipliers, totalMult, effectiveDmg, dps }: {
 formulaDamage?: number;
 formulaMultipliers: Array<{ name: string; multiplier: number; category?: string }>;
 totalMult: number;
 effectiveDmg?: number;
 dps?: number;
}) {
 const [expanded, setExpanded] = useState(true);

 return (
  <div className="formula-terminal">
   <div className="formula-terminal-header" onClick={() => setExpanded(!expanded)}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
     <Eye size={16} />
     <span>Formula Breakdown</span>
    </div>
    {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
   </div>
   {expanded && (
    <div className="formula-terminal-body">
     <div className="formula-line">
      <span className="key">Base Damage</span>
      <span className="op">=</span>
      <span className="val">{formulaDamage?.toLocaleString() ?? '—'}</span>
     </div>
     {formulaMultipliers.map((m, i) => (
      <div className="formula-line" key={i}>
       <span className="key">{m.name || m.category}</span>
       <span className="op">×</span>
       <span className="val">{m.multiplier.toFixed(3)}x</span>
      </div>
     ))}
     <div className="formula-line" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 6, marginTop: 4 }}>
      <span className="key">Total Multiplier</span>
      <span className="op">=</span>
      <span className="val" style={{ color: '#2ecc71' }}>{totalMult.toFixed(3)}x</span>
     </div>
     <div className="formula-line">
      <span className="key">Effective / Shot</span>
      <span className="op">=</span>
      <span className="val" style={{ color: '#f0f6ff', fontWeight: 700 }}>{effectiveDmg?.toLocaleString() ?? '—'}</span>
     </div>
     <div className="formula-line">
      <span className="key">Sustained DPS</span>
      <span className="op">=</span>
      <span className="val" style={{ color: '#5dade2', fontWeight: 700 }}>{dps?.toLocaleString() ?? '—'}</span>
     </div>
    </div>
   )}
  </div>
 );
}

export function ScalerEngine({ calcInput, combatOutput, formulaDamage, formulaMultipliers, totalMult, effectiveDmg, dps }: ScalerEngineProps) {
 const hasStats = effectiveDmg !== undefined && effectiveDmg > 0;
 const dmg = combatOutput?.damageOutput;
 const critMult = dmg?.critMultiplier ?? 1;
 const weakspotMult = dmg?.weakspotMultiplier ?? 1;
 const critRate = calcInput.baseCritRate ?? 0;
 const critDmg = calcInput.baseCritDamage ?? 0;

 return (
  <div className="tactical-column">
   <div className="column-header">
    <Calculator size={18} color="var(--theme-text, #9ff7ff)" />
    <div>
     <p>Magic</p>
     <h3>Scaler Engine</h3>
    </div>
   </div>

   <div className="stat-block-grid">
    <div className="stat-card">
     <div className="stat-label">
      <Crosshair size={14} />
      <span>Base Weapon Damage</span>
     </div>
     <div>
      <div className="stat-value">{calcInput.baseWeaponDMG?.toLocaleString() ?? '—'}</div>
     </div>
    </div>

    <div className="stat-card">
     <div className="stat-label">
      <Zap size={14} />
      <span>Crit</span>
     </div>
     <div>
      <div className="stat-value">{critRate > 0 ? `${(critRate * 100).toFixed(1)}%` : '—'}</div>
      <div className="stat-detail">DMG: {critDmg > 0 ? `${(critDmg * 100).toFixed(1)}%` : '—'} · Net: {critMult.toFixed(2)}x</div>
     </div>
    </div>

    <div className="stat-card">
     <div className="stat-label">
      <Gauge size={14} />
      <span>Weakspot</span>
     </div>
     <div>
      <div className="stat-value">{weakspotMult.toFixed(2)}x</div>
      <div className="stat-detail">Base: {calcInput.baseWeakspotDamage != null ? `${(calcInput.baseWeakspotDamage * 100).toFixed(0)}%` : '—'}</div>
     </div>
    </div>

    <div className="stat-card">
     <div className="stat-label">
      <Target size={14} />
      <span>Fire Rate</span>
     </div>
     <div>
      <div className="stat-value">{calcInput.baseFireRate != null ? `${calcInput.baseFireRate.toFixed(2)} RPS` : '—'}</div>
      <div className="stat-detail">{dmg?.DPS ? `${dmg.DPS.toLocaleString()} DPS` : ''}</div>
     </div>
    </div>

    <div className="stat-card" style={{ borderColor: 'rgba(0, 240, 255, 0.2)' }}>
     <div className="stat-label">
      <Crosshair size={14} />
      <span>Effective Damage / Shot</span>
     </div>
     <div className="stat-value" style={{ color: '#2ecc71', fontSize: '1.25rem' }}>
      {hasStats ? effectiveDmg!.toLocaleString() : '—'}
     </div>
    </div>

    <div className="stat-card" style={{ borderColor: 'rgba(47, 125, 255, 0.2)' }}>
     <div className="stat-label">
      <Calculator size={14} />
      <span>Sustained DPS</span>
     </div>
     <div className="stat-value" style={{ color: '#5dade2', fontSize: '1.35rem' }}>
      {dps ? dps.toLocaleString() : '—'}
     </div>
    </div>
   </div>

   <FormulaTerminal
    formulaDamage={formulaDamage}
    formulaMultipliers={formulaMultipliers}
    totalMult={totalMult}
    effectiveDmg={effectiveDmg}
    dps={dps}
   />

   {calcInput?.conditionalEffects && calcInput.conditionalEffects.length > 0 && (
    <div style={{ borderRadius: 14, border: '1px solid rgba(118, 174, 255, 0.12)', background: 'rgba(2, 7, 17, 0.78)', padding: '10px 12px' }}>
     <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
      <Info size={14} color="#8fa2c8" />
      <span className="slot-label">Active Conditionals</span>
     </div>
     {calcInput.conditionalEffects.map((eff: any, i: number) => (
      <div key={i} style={{ fontSize: '0.75rem', color: '#c6d4ef', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
       {eff.name || eff.effectName}: {eff.active ? 'Active' : 'Inactive'}
       {eff.uptime != null && ` (${(eff.uptime * 100).toFixed(0)}% uptime)`}
      </div>
     ))}
    </div>
   )}

   {calcInput?.availableMechanics && calcInput.availableMechanics.length > 0 && (
    <div style={{ borderRadius: 14, border: '1px solid rgba(118, 174, 255, 0.12)', background: 'rgba(2, 7, 17, 0.78)', padding: '10px 12px' }}>
     <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
      <Eye size={14} color="#8fa2c8" />
      <span className="slot-label">Available Mechanics</span>
     </div>
     <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {calcInput.availableMechanics.map((m: string) => (
       <span key={m} style={{ fontSize: '0.72rem', padding: '3px 8px', borderRadius: 999, background: 'rgba(137, 108, 255, 0.10)', color: '#b9c4ff', border: '1px solid rgba(137, 108, 255, 0.2)' }}>{m}</span>
      ))}
     </div>
    </div>
   )}
  </div>
 );
}
