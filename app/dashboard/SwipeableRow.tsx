"use client";

import { useState } from "react";
import { useSwipeable } from "react-swipeable";

/**
 * Wrapper iOS Mail-like : swipe vers la GAUCHE pour révéler une zone rouge.
 * Si le swipe dépasse le seuil, on commit (animation + callback onCommit).
 * Sinon, snap back à zéro.
 *
 * Travaille au tactile ET à la souris (drag).
 */
export function SwipeableRow({
  children,
  onCommit,
  actionLabel,
  enabled = true,
}: {
  children: React.ReactNode;
  onCommit: () => void;
  actionLabel: string; // ex: "Archiver" ou "Désarchiver"
  enabled?: boolean;
}) {
  const [dx, setDx] = useState(0);
  const [committing, setCommitting] = useState(false);

  const COMMIT_THRESHOLD = 80; // px à atteindre vers la gauche pour commit
  const MAX_DRAG = 150; // limite visuelle

  const handlers = useSwipeable({
    onSwiping: (e) => {
      if (!enabled || committing) return;
      // On ne réagit qu'au swipe horizontal (évite de bloquer le scroll vertical)
      if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) return;
      if (e.deltaX < 0) {
        setDx(Math.max(e.deltaX, -MAX_DRAG));
      } else if (dx < 0) {
        // revient vers la droite après un swipe gauche
        setDx(Math.min(e.deltaX + dx, 0));
      }
    },
    onSwiped: () => {
      if (!enabled || committing) return;
      if (dx <= -COMMIT_THRESHOLD) {
        // Commit : on glisse complètement hors écran puis on appelle l'action
        setCommitting(true);
        setDx(-window.innerWidth);
        // Laisse l'animation se faire avant de muter la donnée
        setTimeout(() => onCommit(), 180);
      } else {
        // Snap back
        setDx(0);
      }
    },
    trackMouse: true,
    preventScrollOnSwipe: true,
    delta: 6,
  });

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Zone rouge révélée derrière le row pendant le swipe */}
      {dx < 0 && (
        <div
          className="absolute inset-0 bg-red-500 flex items-center justify-end px-4"
          aria-hidden="true"
        >
          <span className="text-white text-sm font-medium">{actionLabel}</span>
        </div>
      )}
      <div
        {...handlers}
        style={{
          transform: `translateX(${dx}px)`,
          transition:
            dx === 0 || committing ? "transform 180ms ease" : "none",
        }}
      >
        {children}
      </div>
    </div>
  );
}
