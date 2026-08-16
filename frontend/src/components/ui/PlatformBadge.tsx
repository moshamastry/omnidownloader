import React from 'react';
import { 
  Flame, 
  Share2, 
  Radio, 
  Video, 
  Film 
} from 'lucide-react';

interface PlatformBadgeProps {
  platform: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const PlatformBadge: React.FC<PlatformBadgeProps> = ({ 
  platform, 
  size = 'md', 
  showLabel = true 
}) => {
  const p = (platform || '').toLowerCase();
  const iconSize = size === 'sm' ? 12 : size === 'lg' ? 18 : 14;
  const textSize = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-sm' : 'text-xs';
  const padding = size === 'sm' ? 'px-2 py-0.5' : size === 'lg' ? 'px-3 py-1' : 'px-2.5 py-1';

  let name = platform || 'Web Video';
  let color = 'bg-slate-500/10 text-slate-400 border-slate-500/20';

  const renderIcon = () => {
    if (p.includes('youtube')) {
      return (
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      );
    }
    if (p.includes('instagram')) {
      return (
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
        </svg>
      );
    }
    if (p.includes('tiktok')) {
      return <Flame size={iconSize} />;
    }
    if (p.includes('facebook')) {
      return (
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      );
    }
    if (p.includes('twitter') || p.includes('x.com')) {
      return (
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      );
    }
    if (p.includes('pinterest')) {
      return <Share2 size={iconSize} />;
    }
    if (p.includes('soundcloud')) {
      return <Radio size={iconSize} />;
    }
    if (p.includes('vimeo')) {
      return <Video size={iconSize} />;
    }
    return <Film size={iconSize} />;
  };

  if (p.includes('youtube')) {
    name = 'YouTube';
    color = 'bg-red-500/10 text-red-500 border-red-500/30';
  } else if (p.includes('instagram')) {
    name = 'Instagram';
    color = 'bg-pink-500/10 text-pink-400 border-pink-500/30';
  } else if (p.includes('tiktok')) {
    name = 'TikTok';
    color = 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
  } else if (p.includes('facebook')) {
    name = 'Facebook';
    color = 'bg-blue-500/10 text-blue-400 border-blue-500/30';
  } else if (p.includes('twitter') || p.includes('x.com')) {
    name = 'Twitter / X';
    color = 'bg-sky-500/10 text-sky-400 border-sky-500/30';
  } else if (p.includes('pinterest')) {
    name = 'Pinterest';
    color = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
  } else if (p.includes('soundcloud')) {
    name = 'SoundCloud';
    color = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
  } else if (p.includes('vimeo')) {
    name = 'Vimeo';
    color = 'bg-teal-500/10 text-teal-400 border-teal-500/30';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${color} ${textSize} ${padding}`}>
      {renderIcon()}
      {showLabel && <span>{name}</span>}
    </span>
  );
};
