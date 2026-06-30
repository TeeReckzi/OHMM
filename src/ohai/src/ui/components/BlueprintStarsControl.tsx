import type { BlueprintStars } from '../types';

export function BlueprintStarsControl({ value, max, onChange }: { value: BlueprintStars; max: BlueprintStars; onChange: (v: BlueprintStars) => void }) {
 return (
  <div className="star-row flex gap-0.5" aria-label="Stars matrix">
   {Array.from({ length: max }, (_, i) => {
    const star = (i + 1) as BlueprintStars;
    return (
     <button key={star} type="button" className={`text-xs select-none transition ${star <= value ? 'text-amber-400 font-bold' : 'text-slate-800'}`} onClick={() => onChange(star)}>
      ★
     </button>
    );
   })}
  </div>
 );
}
