import React from 'react';

interface MetaMetricsConsoleProps {
 buildState: string;
 weaponSummary?: string;
 formulaStatus: string;
 damageOutput?: string;
 warnings: string[];
 confidenceSummary?: string;
}

export function MetaMetricsConsole({
 buildState,
 weaponSummary,
 formulaStatus,
 damageOutput,
 warnings,
 confidenceSummary,
}: MetaMetricsConsoleProps) {
 return (
  <aside className="meta-metrics-console">
   <div className="console-header">
    <h3>Meta Metrics Console</h3>
    <span className="build-state">{buildState}</span>
   </div>

   {weaponSummary && (
    <div className="console-section">
     <div className="section-label">Selected Weapon</div>
     <div className="console-value">{weaponSummary}</div>
    </div>
   )}

   <div className="console-section">
    <div className="section-label">Formula Status</div>
    <div className={`console-value formula-${formulaStatus.includes('blocked') ? 'blocked' : 'ready'}`}>
     {formulaStatus}
    </div>
   </div>

   {damageOutput && (
    <div className="console-section">
     <div className="section-label">Damage Output</div>
     <div className="console-value damage">{damageOutput}</div>
    </div>
   )}

   {warnings.length > 0 && (
    <div className="console-section warnings">
     <div className="section-label">Active Warnings</div>
     {warnings.map((w, i) => (
      <div key={i} className="warning-line">{w}</div>
     ))}
    </div>
   )}

   {confidenceSummary && (
    <div className="console-section">
     <div className="section-label">Data Confidence</div>
     <div className="console-value confidence">{confidenceSummary}</div>
    </div>
   )}
  </aside>
 );
}
