import { useEffect, useState } from 'react';

const eventSlides = [
  {
    title: 'Weddings',
    gradient: 'from-rose-300 via-pink-200 to-rose-100',
    accent: 'from-rose-500/20 to-pink-500/20'
  },
  {
    title: 'Birthday Parties',
    gradient: 'from-blue-300 via-indigo-200 to-purple-100',
    accent: 'from-blue-500/20 to-purple-500/20'
  },
  {
    title: 'Graduations',
    gradient: 'from-emerald-300 via-green-200 to-teal-100',
    accent: 'from-green-500/20 to-emerald-500/20'
  },
  {
    title: 'Concerts',
    gradient: 'from-violet-300 via-purple-200 to-indigo-100',
    accent: 'from-violet-500/20 to-indigo-500/20'
  }
];

export default function EventSlideshow() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % eventSlides.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 -z-10">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-white">
        <div className="absolute inset-0 memory-background-pattern opacity-30" />
      </div>

      {/* Slideshow */}
      <div className="absolute inset-0 overflow-hidden">
        {eventSlides.map((slide, index) => (
          <div
            key={slide.title}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out
              ${index === currentIndex ? 'opacity-100' : 'opacity-0'}`}
          >
            {/* Gradient Background */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${slide.gradient} transform scale-105`}
              style={{
                animation: index === currentIndex ? 'slowZoom 10s ease-in-out forwards' : 'none'
              }}
            />
            
            {/* Accent Gradient Overlay */}
            <div className={`absolute inset-0 bg-gradient-to-br ${slide.accent} backdrop-blur-sm`} />
            
            {/* Decorative Patterns */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.8),transparent)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_-20%_-20%,rgba(255,255,255,0.4),transparent)]" />
            </div>
            
            {/* Content */}
            <div className="absolute inset-0 flex items-center justify-center">
              <h2 className="text-4xl md:text-5xl font-display text-white opacity-20 tracking-wider transform -rotate-12 transition-all duration-1000 ease-in-out">
                {slide.title}
              </h2>
            </div>
          </div>
        ))}
      </div>

      {/* Decorative elements */}
      <div className="absolute inset-0">
        <div className="memory-sparkle" style={{ top: '10%', left: '20%' }} />
        <div className="memory-sparkle" style={{ top: '30%', left: '70%' }} />
        <div className="memory-sparkle" style={{ top: '70%', left: '30%' }} />
        <div className="memory-sparkle" style={{ top: '80%', left: '80%' }} />
      </div>
    </div>
  );
} 