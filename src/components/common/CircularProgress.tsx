import React from 'react';

interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  sublabel?: string;
  showStatusBadge?: boolean;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  percentage,
  size = 180,
  strokeWidth = 14,
  sublabel = 'Overall Attendance',
  showStatusBadge = true,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedPercentage = Math.min(100, Math.max(0, percentage));
  const strokeDashoffset = circumference - (clampedPercentage / 100) * circumference;

  // Determine color status
  let ringColor = '#10b981'; // emerald-500
  let ringGradientId = 'emeraldGrad';
  let statusText = 'Eligible (Good Standing)';
  let statusBadgeClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';

  if (clampedPercentage < 75) {
    ringColor = '#f43f5e'; // rose-500
    ringGradientId = 'roseGrad';
    statusText = 'Critical Shortage (< 75%)';
    statusBadgeClass = 'bg-rose-500/15 text-rose-400 border-rose-500/30 animate-pulse';
  } else if (clampedPercentage < 85) {
    ringColor = '#f59e0b'; // amber-500
    ringGradientId = 'amberGrad';
    statusText = 'Borderline Warning';
    statusBadgeClass = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="w-full h-full -rotate-90 transform" viewBox={`0 0 ${size} ${size}`}>
          <defs>
            <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <linearGradient id="amberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
            <linearGradient id="roseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fb7185" />
              <stop offset="100%" stopColor="#e11d48" />
            </linearGradient>
          </defs>

          {/* Background circle track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-800/80"
            fill="transparent"
          />

          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={`url(#${ringGradientId})`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none">
          <span className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
            {clampedPercentage}%
          </span>
          <span className="text-xs font-medium uppercase tracking-wider text-slate-400 mt-0.5">
            {sublabel}
          </span>
        </div>
      </div>

      {showStatusBadge && (
        <div className={`mt-3 px-3 py-1 rounded-full text-xs font-semibold border ${statusBadgeClass}`}>
          {statusText}
        </div>
      )}
    </div>
  );
};
