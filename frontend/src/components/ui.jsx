
import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

const GLYPHS = ['∑', '∫', 'π', '√', '∞', 'φ', 'Δ', '∂', 'ℝ', '≡', 'λ', '∮'];

export function BackgroundFX() {
  const [glyphs] = useState(() =>
    GLYPHS.map((g, i) => ({
      g,
      left: (i * 83 + 7) % 96,
      top: (i * 41 + 11) % 92,
      size: 26 + ((i * 17) % 46),
      delay: (i * 1.7) % 12,
    }))
  );
  return (
    <div className="bg-fx" aria-hidden="true">
      {glyphs.map((x, i) => (
        <span
          key={i}
          className="glyph"
          style={{
            left: `${x.left}%`, top: `${x.top}%`,
            fontSize: x.size, animationDelay: `-${x.delay}s`,
          }}
        >
          {x.g}
        </span>
      ))}
    </div>
  );
}

export const DiffBadge = ({ d }) => (
  <span className={`diff-badge diff-${(d || '').toLowerCase()}`}>{d || '—'}</span>
);
export const TopicTag = ({ t }) => <span className="topic-tag">{t}</span>;

export function AnimatedNumber({ value, duration = 1000, format = v => Math.round(v) }) {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    const target = Number(value) || 0;
    if (reduce) { setDisplay(target); fromRef.current = target; return; }
    const from = fromRef.current;
    const start = performance.now();
    let raf;
    const tick = now => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (target - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, reduce]);

  return <>{format(display)}</>;
}
