import React, { useRef, useState } from 'react';
import { GripVertical, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * Admin pieces for the fan of stories on the home page.
 *
 * The fan has no data of its own — it shows the stories switched on for it,
 * in their fan order, each with its own upright picture or else its cover.
 */

export interface FanItem {
  id: number;
  couple: string;
  fan_order: number | null;
  fan_image: string | null;
  cover_url: string | null;
  is_published: boolean;
}

/** The five places, in order; drag a story onto another place to reorder. */
export function FanBoard({ items, onReorder }: {
  items: FanItem[];
  onReorder: (ids: number[]) => void;
}) {
  const inFan = items
    .filter(s => s.fan_order != null && s.is_published)
    .sort((a, b) => (a.fan_order ?? 0) - (b.fan_order ?? 0));
  const [drag, setDrag] = useState<number | null>(null);

  const drop = (target: number) => {
    if (drag === null || drag === target) return;
    const ids = inFan.map(s => s.id);
    const [moved] = ids.splice(drag, 1);
    ids.splice(target, 0, moved);
    setDrag(null);
    onReorder(ids);
  };

  return (
    <div className="bg-moody-900/40 border border-white/10 rounded-sm p-4 mb-7">
      <div className="flex items-baseline justify-between gap-4 mb-3">
        <p className="text-white/60 text-xs tracking-widest uppercase font-bold">Lepeza na naslovnoj</p>
        <p className="text-white/25 text-[10px]">Povuci priču na drugo mjesto da promijeniš redoslijed.</p>
      </div>
      <div className="grid grid-cols-5 gap-2.5">
        {Array.from({ length: 5 }, (_, i) => {
          const s = inFan[i];
          const img = s?.fan_image || s?.cover_url;
          return (
            <div
              key={i}
              draggable={Boolean(s)}
              onDragStart={() => setDrag(i)}
              onDragOver={e => { if (s && drag !== null) e.preventDefault(); }}
              onDrop={() => drop(i)}
              className={cn(
                'relative rounded-sm border overflow-hidden aspect-[2/3] select-none',
                s ? 'border-white/15 cursor-grab active:cursor-grabbing' : 'border-dashed border-white/10',
                drag === i && 'opacity-40',
              )}
            >
              {s ? (
                <>
                  {img && <img src={img} alt="" className="absolute inset-0 w-full h-full object-cover" draggable={false} />}
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-2 pt-6 pb-2">
                    <span className="block text-white text-[11px] leading-tight truncate">{s.couple}</span>
                  </span>
                  <span className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-black/60 text-gold-400 text-[10px] font-bold rounded-sm px-1.5 py-0.5">
                    <GripVertical size={10} /> {i + 1}
                  </span>
                </>
              ) : (
                <span className="absolute inset-0 flex items-center justify-center text-white/15 text-[11px]">{i + 1}</span>
              )}
            </div>
          );
        })}
      </div>
      {inFan.length < 3 && (
        <p className="flex items-center gap-2 mt-3 text-amber-300/80 text-[11px]">
          <AlertTriangle size={13} className="flex-none" />
          U lepezi je {inFan.length} {inFan.length === 1 ? 'priča' : 'priče'}. Ispod 3 sekcija se na naslovnoj ne prikazuje.
        </p>
      )}
    </div>
  );
}

/**
 * Pick the point of the photograph that must stay in frame. The whole picture
 * is shown uncropped beside a preview of the 2:3 crop the site will use.
 */
export function FocusPicker({ src, value, onChange, ratio = '2 / 3' }: {
  src: string;
  value: string;
  onChange: (v: string) => void;
  ratio?: string;
}) {
  const img = useRef<HTMLImageElement>(null);
  const pick = (e: React.MouseEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const el = img.current;
    let left = box.left, top = box.top, w = box.width, h = box.height;
    if (el?.naturalWidth && el.naturalHeight) {
      const k = Math.min(box.width / el.naturalWidth, box.height / el.naturalHeight);
      w = el.naturalWidth * k; h = el.naturalHeight * k;
      left = box.left + (box.width - w) / 2; top = box.top + (box.height - h) / 2;
    }
    const x = Math.round(((e.clientX - left) / w) * 100);
    const y = Math.round(((e.clientY - top) / h) * 100);
    if (x < 0 || x > 100 || y < 0 || y > 100) return;
    onChange(`${x}% ${y}%`);
  };
  const [fx, fy] = (value || '50% 50%').split(' ');
  return (
    <div className="flex gap-3 items-start">
      <div onClick={pick} className="relative w-44 h-32 bg-moody-950 rounded-sm cursor-crosshair overflow-hidden border border-white/10">
        <img ref={img} src={src} alt="" className="w-full h-full object-contain" draggable={false} />
        {value && (
          <span
            aria-hidden="true"
            className="absolute w-3 h-3 -ml-1.5 -mt-1.5 rounded-full border-2 border-gold-400 bg-black/30 pointer-events-none"
            style={{ left: fx, top: fy }}
          />
        )}
      </div>
      <div className="w-[86px] flex-none">
        <div className="rounded-sm overflow-hidden border border-white/10 bg-moody-950" style={{ aspectRatio: ratio }}>
          <img src={src} alt="" className="w-full h-full object-cover" style={{ objectPosition: value || '50% 50%' }} draggable={false} />
        </div>
        <p className="text-white/25 text-[9px] mt-1 leading-snug">Ovako izgleda u lepezi</p>
      </div>
    </div>
  );
}

/** "The fan is full — which story should make room?" */
export function FanFullDialog({ fan, onPick, onCancel }: {
  fan: { id: number; couple: string; fan_order: number }[];
  onPick: (id: number) => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70" onClick={onCancel} />
      <div className="relative w-full max-w-sm bg-moody-900 border border-white/10 rounded-sm p-5">
        <p className="text-white text-sm mb-1">Lepeza je puna.</p>
        <p className="text-white/45 text-xs mb-4">Zamijeniti koju priču? Ona izlazi iz lepeze, a ova ulazi na njeno mjesto.</p>
        <div className="space-y-1.5">
          {fan.map(f => (
            <button key={f.id} type="button" onClick={() => onPick(f.id)}
              className="w-full flex items-center gap-3 text-left bg-moody-950/60 hover:bg-gold-600/15 border border-white/5 hover:border-gold-600/40 rounded-sm px-3 py-2.5 transition-colors">
              <span className="text-gold-400 text-xs font-bold w-4">{f.fan_order}</span>
              <span className="text-white/80 text-sm truncate">{f.couple}</span>
            </button>
          ))}
        </div>
        <button type="button" onClick={onCancel} className="mt-4 text-white/40 hover:text-white/70 text-xs">Odustani</button>
      </div>
    </div>
  );
}
