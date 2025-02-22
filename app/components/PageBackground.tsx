import { useEffect, useState } from 'react';

type BackgroundTheme = {
  gradient: string;
  accent: string;
};

type PageType = 'auth' | 'events' | 'create' | 'gallery' | 'upload';

const backgroundThemes: Record<PageType, BackgroundTheme[]> = {
  auth: [
    {
      gradient: 'from-memory-300 via-pink-200 to-memory-100',
      accent: 'from-memory-500/20 to-pink-500/20'
    },
    {
      gradient: 'from-pink-300 via-memory-200 to-rose-100',
      accent: 'from-pink-500/20 to-memory-500/20'
    }
  ],
  events: [
    {
      gradient: 'from-blue-300 via-indigo-200 to-purple-100',
      accent: 'from-blue-500/20 to-purple-500/20'
    },
    {
      gradient: 'from-purple-300 via-blue-200 to-indigo-100',
      accent: 'from-purple-500/20 to-blue-500/20'
    }
  ],
  create: [
    {
      gradient: 'from-emerald-300 via-green-200 to-teal-100',
      accent: 'from-emerald-500/20 to-green-500/20'
    },
    {
      gradient: 'from-teal-300 via-emerald-200 to-green-100',
      accent: 'from-teal-500/20 to-emerald-500/20'
    }
  ],
  gallery: [
    {
      gradient: 'from-slate-200 via-blue-100 to-indigo-50',
      accent: 'from-blue-300/10 to-indigo-300/10'
    },
    {
      gradient: 'from-blue-100 via-indigo-50 to-slate-100',
      accent: 'from-indigo-300/10 to-blue-300/10'
    }
  ],
  upload: [
    {
      gradient: 'from-violet-300 via-purple-200 to-indigo-100',
      accent: 'from-violet-500/20 to-purple-500/20'
    },
    {
      gradient: 'from-indigo-300 via-violet-200 to-purple-100',
      accent: 'from-indigo-500/20 to-violet-500/20'
    }
  ]
};

interface PageBackgroundProps {
  pageType: PageType;
}

export default function PageBackground({ pageType }: PageBackgroundProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const themes = backgroundThemes[pageType];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % themes.length);
    }, 7000); // Change slide every 7 seconds

    return () => clearInterval(interval);
  }, [themes.length]);

  return (
    <div className="fixed inset-0 -z-10">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-white">
        <div className="absolute inset-0 memory-background-pattern opacity-30" />
      </div>

      {/* Slideshow */}
      <div className="absolute inset-0 overflow-hidden">
        {themes.map((theme, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1500 ease-in-out
              ${index === currentIndex ? 'opacity-100' : 'opacity-0'}`}
          >
            {/* Gradient Background */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} transform scale-105`}
              style={{
                animation: index === currentIndex ? 'slowZoom 10s ease-in-out forwards' : 'none'
              }}
            />
            
            {/* Accent Gradient Overlay */}
            <div className={`absolute inset-0 bg-gradient-to-br ${theme.accent} backdrop-blur-sm`} />
            
            {/* Decorative Patterns */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.8),transparent)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_-20%_-20%,rgba(255,255,255,0.4),transparent)]" />
            </div>
          </div>
        ))}
      </div>

      {/* Decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="memory-sparkle" style={{ top: '10%', left: '20%' }} />
        <div className="memory-sparkle" style={{ top: '30%', left: '70%' }} />
        <div className="memory-sparkle" style={{ top: '70%', left: '30%' }} />
        <div className="memory-sparkle" style={{ top: '80%', left: '80%' }} />
      </div>
    </div>
  );
} 