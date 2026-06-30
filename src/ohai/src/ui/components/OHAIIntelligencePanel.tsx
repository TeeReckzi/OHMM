import { Activity, AlertTriangle, CheckCircle2, Cpu, ShieldAlert, Zap } from 'lucide-react';
import type { ReactNode } from 'react';
import type { BuildIntelligenceSummary, BuildTrustState } from '../intelligence/buildIntelligenceSummary';
import { BUFF_TAG_FAMILY_SUMMARIES, type BuffTagFamilySummary } from '../data/recovered/buffTagPropMap';
import { OHMMLogo as OHAILogo } from './OHMMLogo';

const TRUST_LABELS: Record<BuildTrustState, string> = {
 verified: 'Verified',
 candidate: 'Candidate',
 blocked: 'Blocked',
 'needs-validation': 'Needs Validation',
};

export function OHAIIntelligencePanel({ summary }: { summary: BuildIntelligenceSummary }) {
 return (
  <aside className="panel ohai-intelligence-panel ohai-neural-pulse" aria-label="OHAI Intelligence Panel">
   <div className="ohai-panel-topline">
    <OHAILogo variant="mark" size="sm" />
    <div>
     <p className="eyebrow">OHMM Intelligence</p>
     <h3>Build Trust State</h3>
    </div>
   </div>

   <TrustStateBadge state={summary.trustState} />

   <section className="ohai-output-grid" aria-label="Damage output summary">
    <OutputMetric icon={<Zap size={15} />} label="Damage / Shot" value={summary.damagePerShot} />
    <OutputMetric icon={<Activity size={15} />} label="DPS" value={summary.dps} />
    <OutputMetric icon={<Cpu size={15} />} label="TTK" value={summary.ttk} />
   </section>

   {summary.outputBlockedReasons.length > 0 && (
    <section className="ohai-status-block blocked">
     <div className="ohai-status-title"><ShieldAlert size={15} /> Output Blockers</div>
     {summary.outputBlockedReasons.slice(0, 4).map((reason) => <p key={reason}>{reason}</p>)}
    </section>
   )}

   <section className="ohai-status-block">
    <div className="ohai-status-title"><Cpu size={15} /> Formula Confidence</div>
    <p>Runtime status: <strong>{summary.formulaStatus}</strong></p>
    {summary.unresolvedAssumptions.slice(0, 5).map((note) => <p key={note}>{note}</p>)}
   </section>

   <section className="ohai-chip-section">
    <div className="ohai-status-title"><CheckCircle2 size={15} /> Registry Confidence</div>
    {summary.registryConfidence.map((item) => <StatusChip key={item.label} {...item} />)}
   </section>

   <section className="ohai-chip-section">
    <div className="ohai-status-title"><AlertTriangle size={15} /> Compatibility</div>
    {summary.compatibility.map((item) => <StatusChip key={item.label} {...item} />)}
   </section>

   <RecoveredBuffFamilies />

   <section className="ohai-insights">
    <div className="ohai-status-title">Top OHMM Insights</div>
    {summary.insights.slice(0, 5).map((insight) => <p key={insight}>{insight}</p>)}
   </section>
  </aside>
 );
}

function TrustStateBadge({ state }: { state: BuildTrustState }) {
 return <div className={`trust-state-badge ${state}`}>{TRUST_LABELS[state]}</div>;
}

function OutputMetric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
 return (
  <div className="ohai-output-metric">
   <span>{icon}{label}</span>
   <strong>{value}</strong>
  </div>
 );
}

function StatusChip({ label, value, state }: { label: string; value: string; state: BuildTrustState }) {
 return (
  <div className={`ohai-status-chip ${state}`}>
   <span>{label}</span>
   <strong>{value}</strong>
  </div>
 );
}

function RecoveredBuffFamilies() {
 return (
  <section className="ohai-chip-section" aria-label="Recovered Buff Families">
   <div className="ohai-status-title">Recovered Buff Families</div>
   <p style={{ fontSize: '0.65rem', opacity: 0.7, margin: '4px 0 8px' }}>
    Recovered static data from <code>buff_tag_prop_map.py</code>. Not yet wired into the authoritative damage formula engine.
   </p>
   {BUFF_TAG_FAMILY_SUMMARIES.map((summary) => (
    <RecoveredBuffFamilyRow key={summary.family} summary={summary} />
   ))}
  </section>
 );
}

function RecoveredBuffFamilyRow({ summary }: { summary: BuffTagFamilySummary }) {
 const isBuff = summary.props.some((p) => p.startsWith('tag_buff_'));
 const badgeText = isBuff ? 'BUFF' : 'DEBUFF';
 const badgeColor = isBuff ? '#3498db' : '#e67e22';
 return (
  <div className="ohai-status-chip candidate" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
   <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: 8 }}>
    <span>
     <code style={{ color: '#67b7ff' }}>{summary.family}</code>
     {summary.semanticLabel && (
      <span style={{ opacity: 0.7, marginLeft: 6 }}>· {summary.semanticLabel}</span>
     )}
    </span>
    <span
     style={{
      display: 'inline-block',
      padding: '1px 6px',
      borderRadius: 999,
      fontSize: '0.6rem',
      fontWeight: 700,
      letterSpacing: '0.04em',
      color: badgeColor,
      border: `1px solid ${badgeColor}66`,
      background: `${badgeColor}14`,
     }}
     title="Recovered from buff_tag_prop_map.py"
    >
     {badgeText}
    </span>
   </div>
   <div style={{ fontSize: '0.6rem', opacity: 0.65, lineHeight: 1.35 }}>
    {summary.props.map((p) => (
     <div key={p}>
      <code>{p}</code>
     </div>
    ))}
   </div>
  </div>
 );
}
