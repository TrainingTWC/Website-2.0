import { useEffect, useState } from "react";

interface CountdownTimerProps {
  expiresAt: number; // epoch ms
  className?: string;
}

function getRemaining(expiresAt: number) {
  const diff = Math.max(0, expiresAt - Date.now());
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds, expired: diff === 0 };
}

export function CountdownTimer({ expiresAt, className = "" }: CountdownTimerProps) {
  const [remaining, setRemaining] = useState(() => getRemaining(expiresAt));

  useEffect(() => {
    if (remaining.expired) return;
    const id = setInterval(() => {
      const r = getRemaining(expiresAt);
      setRemaining(r);
      if (r.expired) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [expiresAt, remaining.expired]);

  if (remaining.expired) {
    return (
      <span className={`font-mono text-xs font-bold text-natural-muted ${className}`}>
        Sale ended
      </span>
    );
  }

  if (remaining.days > 0) {
    return (
      <span className={`font-mono text-xs font-bold text-natural-accent ${className}`}>
        {remaining.days}d {remaining.hours}h {remaining.minutes}m
      </span>
    );
  }

  const hh = String(remaining.hours).padStart(2, "0");
  const mm = String(remaining.minutes).padStart(2, "0");
  const ss = String(remaining.seconds).padStart(2, "0");
  return (
    <span className={`font-mono text-xs font-bold text-natural-accent tracking-widest ${className}`}>
      {hh}:{mm}:{ss}
    </span>
  );
}
