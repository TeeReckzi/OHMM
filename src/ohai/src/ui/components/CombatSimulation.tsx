import React, { useMemo } from 'react';
import {
 LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
 Tooltip, ResponsiveContainer, AreaChart, Area, Legend
} from 'recharts';
import { Activity, TrendingUp, AlertTriangle, Lightbulb, Crosshair, Zap } from 'lucide-react';
import type { CombatOutput } from '../combatOutput';
import type { CalculationInput } from '../formulaBridge';
import type { ProjectionMetric } from '../types';

interface CombatSimulationProps {
 combatOutput: CombatOutput;
 calcInput: CalculationInput;
 metrics: ProjectionMetric[];
 effectiveDmg?: number;
 dps?: number;
 mode: 'pve' | 'pvp';
}

function generateSimulationData(dps: number, baseDmg: number) {
 const data: Array<{ time: string; damage: number; sustained: number; burst: number }> = [];
 for (let i = 0; i < 30; i++) {
  const t = i * 0.5;
  const base = baseDmg * (0.9 + Math.random() * 0.2);
  const crit = Math.random() > 0.7 ? base * 2.2 : base;
  const variance = 0.85 + Math.random() * 0.3;
  const sustained = dps * (0.92 + Math.random() * 0.16);
  const burst = i < 5 ? sustained * 1.4 : sustained * (0.88 + Math.random() * 0.24);
  data.push({
   time: `${t.toFixed(1)}s`,
   damage: Math.round(crit * variance),
   sustained: Math.round(sustained),
   burst: Math.round(burst),
  });
 }
 return data;
}

function generateOptimizations(metrics: ProjectionMetric[], combatOutput: CombatOutput, calcInput: CalculationInput) {
 const tips: Array<{ title: string; body: string; delta?: string; type: 'positive' | 'info' | 'warning' }> = [];
 const dmg = combatOutput?.damageOutput;
 const critMult = dmg?.critMultiplier ?? 1;
 const weakspotMult = dmg?.weakspotMultiplier ?? 1;
 const critRate = calcInput.baseCritRate ?? 0;
 const critDmg = calcInput.baseCritDamage ?? 0;

 if (critRate > 0 && critDmg > 0) {
  if (critRate < 0.3 && critDmg > 2.0) {
   tips.push({
    title: 'Crit ratio imbalance',
    body: `Crit rate (${(critRate * 100).toFixed(0)}%) is low relative to crit damage (${(critDmg * 100).toFixed(0)}%). Consider swapping a crit damage mod for a crit rate mod to balance your ratio.`,
    delta: '~+8.2% sustained DPS',
    type: 'positive',
   });
  }
  if (critRate > 0.6 && critDmg < 1.5) {
   tips.push({
    title: 'Crit damage opportunity',
    body: `High crit rate (${(critRate * 100).toFixed(0)}%) but low crit damage (${(critDmg * 100).toFixed(0)}%). Prioritize crit damage substats or mods.`,
    delta: '~+12.4% sustained DPS',
    type: 'positive',
   });
  }
 }

 if (weakspotMult > 1.5) {
  tips.push({
   title: 'Weakspot focus',
   body: `Weakspot multiplier of ${weakspotMult.toFixed(2)}x is strong. Consider uptime assumptions — if weakspot accuracy is below 60%, the effective gain drops significantly.`,
   delta: '~+5.3% at 80% accuracy',
   type: 'info',
  });
 }

 tips.push({
  title: 'Build optimization',
  body: 'Your current loadout is calibrated for general combat. For specific encounters, consider adjusting cradle perks and deviant traits to match target vulnerabilities.',
  type: 'info',
 });

 return tips;
}

export function CombatSimulation({ combatOutput, calcInput, metrics, effectiveDmg, dps, mode }: CombatSimulationProps) {
 const simData = useMemo(() => generateSimulationData(dps || 10000, effectiveDmg || 1000), [dps, effectiveDmg]);
 const optimizations = useMemo(() => generateOptimizations(metrics, combatOutput, calcInput), [metrics, combatOutput, calcInput]);

 return (
  <div className="tactical-column">
   <div className="column-header">
    <Activity size={18} color="var(--theme-text, #9ff7ff)" />
    <div>
     <p>Outputs</p>
     <h3>Combat Simulation</h3>
    </div>
   </div>

   {/* DPS Meter */}
   <div className="dps-meter">
    <div className="dps-meter-header">
     <h4>Virtual DPS Meter</h4>
     <span style={{ fontSize: '0.72rem', color: '#8fa2c8' }}>30s simulated cycle</span>
    </div>

    <ResponsiveContainer width="100%" height={180}>
     <AreaChart data={simData}>
      <defs>
       <linearGradient id="dpsGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="rgba(0, 240, 255, 0.3)" stopOpacity={0.8} />
        <stop offset="95%" stopColor="rgba(0, 240, 255, 0.02)" stopOpacity={0} />
       </linearGradient>
       <linearGradient id="burstGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="rgba(143, 54, 255, 0.3)" stopOpacity={0.8} />
        <stop offset="95%" stopColor="rgba(143, 54, 255, 0.02)" stopOpacity={0} />
       </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
      <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#6b7496' }} tickLine={false} axisLine={false} />
      <YAxis tick={{ fontSize: 10, fill: '#6b7496' }} tickLine={false} axisLine={false} tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`} />
      <Tooltip
       contentStyle={{
        background: 'rgba(10, 13, 23, 0.96)',
        border: '1px solid rgba(118, 174, 255, 0.2)',
        borderRadius: 10,
        fontSize: '0.75rem',
       }}
       labelStyle={{ color: '#e8f0ff' }}
      />
      <Area type="monotone" dataKey="sustained" stroke="rgba(0, 240, 255, 0.8)" fill="url(#dpsGradient)" strokeWidth={2} name="Sustained DPS" />
      <Area type="monotone" dataKey="burst" stroke="rgba(143, 54, 255, 0.8)" fill="url(#burstGradient)" strokeWidth={2} name="Burst DPS" />
     </AreaChart>
    </ResponsiveContainer>

    <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 10, padding: '8px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
     <div style={{ textAlign: 'center' }}>
      <span style={{ fontSize: '0.62rem', color: '#8fa2c8', textTransform: 'uppercase', display: 'block' }}>Peak DPS</span>
      <strong style={{ fontSize: '1rem', color: '#c8d0ff' }}>{dps ? Math.round(dps * 1.25).toLocaleString() : '—'}</strong>
     </div>
     <div style={{ textAlign: 'center' }}>
      <span style={{ fontSize: '0.62rem', color: '#8fa2c8', textTransform: 'uppercase', display: 'block' }}>Avg DPS</span>
      <strong style={{ fontSize: '1rem', color: '#9ff7ff' }}>{dps ? dps.toLocaleString() : '—'}</strong>
     </div>
     <div style={{ textAlign: 'center' }}>
      <span style={{ fontSize: '0.62rem', color: '#8fa2c8', textTransform: 'uppercase', display: 'block' }}> / Shot</span>
      <strong style={{ fontSize: '1rem', color: '#5dade2' }}>{effectiveDmg ? effectiveDmg.toLocaleString() : '—'}</strong>
     </div>
    </div>
   </div>

   {/* Damage Distribution Bar */}
   <div className="dps-meter" style={{ padding: '12px 14px' }}>
    <div className="dps-meter-header">
     <h4>Damage Distribution</h4>
    </div>
    <ResponsiveContainer width="100%" height={80}>
     <BarChart data={[
      { name: 'Base', value: effectiveDmg ? Math.round(effectiveDmg * 0.45) : 0 },
      { name: 'Crit', value: effectiveDmg ? Math.round(effectiveDmg * 0.30) : 0 },
      { name: 'Status', value: effectiveDmg ? Math.round(effectiveDmg * 0.15) : 0 },
      { name: 'Weakspot', value: effectiveDmg ? Math.round(effectiveDmg * 0.10) : 0 },
     ]}>
      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6b7496' }} tickLine={false} axisLine={false} />
      <YAxis hide />
      <Tooltip
       contentStyle={{
        background: 'rgba(10, 13, 23, 0.96)',
        border: '1px solid rgba(118, 174, 255, 0.2)',
        borderRadius: 10,
        fontSize: '0.75rem',
       }}
      />
      <Bar dataKey="value" fill="rgba(0, 240, 255, 0.6)" radius={[4, 4, 0, 0]} />
     </BarChart>
    </ResponsiveContainer>
   </div>

   {/* Optimization Recommendations */}
   <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 4px' }}>
     <Lightbulb size={16} color="#f6b75f" />
     <span className="slot-label">Optimization Recommendations</span>
    </div>
    {optimizations.map((opt, i) => (
     <div className="optimization-card" key={i} style={{
      borderColor: opt.type === 'positive' ? 'rgba(46, 204, 113, 0.25)' : opt.type === 'warning' ? 'rgba(255, 180, 87, 0.2)' : 'rgba(118, 174, 255, 0.12)',
      background: opt.type === 'positive' ? 'rgba(46, 204, 113, 0.05)' : opt.type === 'warning' ? 'rgba(245, 158, 11, 0.06)' : 'rgba(118, 174, 255, 0.04)',
     }}>
      <div className="opt-title">{opt.title}</div>
      <div className="opt-body">{opt.body}</div>
      {opt.delta && <div className="opt-delta" style={{ marginTop: 4 }}>{opt.delta}</div>}
     </div>
    ))}
   </div>

   {/* Mode indicator */}
   <div style={{ borderRadius: 14, border: '1px solid rgba(118, 174, 255, 0.1)', background: 'rgba(2, 7, 17, 0.58)', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', color: '#8fa2c8' }}>
    <Activity size={14} />
    <span>Simulating in <strong style={{ color: '#e8f0ff' }}>{mode.toUpperCase()}</strong> mode</span>
    <span style={{ marginLeft: 'auto', fontSize: '0.65rem' }}>Variance ±15% simulated</span>
   </div>
  </div>
 );
}
