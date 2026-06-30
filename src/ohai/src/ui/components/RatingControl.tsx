import type { ChefRexSkillRating } from '../types';

interface RatingControlProps {
 label: string;
 value: number;
 onChange: (v: ChefRexSkillRating) => void;
}

export function RatingControl({ label, value, onChange }: RatingControlProps) {
 return (
  <div className="rating-control flex justify-between items-center text-xs">
   <span className="text-slate-400">{label}</span>
   <div className="rating-stars flex gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
     <button
      key={star} type="button"
      className={`text-sm transition ${star <= value ? 'text-purple-400 font-bold drop-shadow-[0_0_6px_rgba(192,132,252,0.4)]' : 'text-slate-700'}`}
      onClick={() => onChange(Math.min(5, Math.max(1, star)) as ChefRexSkillRating)}
     >
      ★
     </button>
    ))}
   </div>
  </div>
 );
}
