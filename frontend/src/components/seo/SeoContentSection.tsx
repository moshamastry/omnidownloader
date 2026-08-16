import React, { useState } from 'react';
import { 
  Zap, 
  ShieldCheck, 
  Sparkles, 
  ChevronDown, 
  Film, 
  Music, 
  Layers, 
  CheckCircle2, 
  Download, 
  Smartphone, 
  Laptop, 
  Globe, 
  Lock, 
  Star,
  Flame,
  Award
} from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

export const SeoContentSection: React.FC = () => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const faqs: FaqItem[] = [
    {
      question: 'Is OmniDownloader Pro 100% free to use?',
      answer: 'Yes! OmniDownloader Pro is completely free to use. You can download videos, reels, playlists, and audio without any subscription fee, credit card requirement, or hidden costs.'
    },
    {
      question: 'Can I download Instagram Reels and TikTok videos without watermarks?',
      answer: 'Absolutely. OmniDownloader extracts the direct clean original media streams from Instagram Reels, Stories, Posts, and TikTok videos without adding any watermark or re-encoding quality loss.'
    },
    {
      question: 'Does OmniDownloader support 4K and 8K Ultra HD video downloads?',
      answer: 'Yes! Our high-performance yt-dlp & FFmpeg backend supports up to 8K Ultra HD, 4K (2160p), 2K (1440p), 1080p 60fps Full HD, and 720p HD formats with automatic audio-video stream merging.'
    },
    {
      question: 'How do I convert YouTube videos and reels to MP3 audio files?',
      answer: 'Simply paste any video link into the search box, select the "MP3 Audio (320kbps)" preset from the quality dropdown, and click Download. The audio will be extracted at maximum bitrate.'
    },
    {
      question: 'How do I transfer downloaded videos directly to my phone (iPhone & Android)?',
      answer: 'Once your download is completed on your computer or browser, click the "📱 Download to Phone (QR)" button. Point your mobile phone camera at the QR code for instant direct transfer!'
    },
    {
      question: 'Is my data and download history private?',
      answer: 'Yes, 100%. OmniDownloader does not track your download links or log personal browsing activity. Download history is stored strictly on your local browser device with full client-side privacy.'
    }
  ];

  const platforms = [
    {
      name: 'YouTube',
      desc: '4K/1080p Videos, Shorts & MP3',
      color: 'from-red-600 to-rose-600',
      badge: '8K / 4K / MP3'
    },
    {
      name: 'Instagram',
      desc: 'Reels, Stories, Carousels & IGTV',
      color: 'from-purple-600 via-pink-600 to-amber-500',
      badge: 'No Watermark'
    },
    {
      name: 'TikTok',
      desc: 'HD Videos & Soundtracks Clean',
      color: 'from-cyan-500 to-blue-600',
      badge: 'Zero Watermark'
    },
    {
      name: 'Facebook',
      desc: 'Public Watch & Reel Streams',
      color: 'from-blue-600 to-indigo-600',
      badge: '1080p Full HD'
    },
    {
      name: 'Twitter / X',
      desc: 'High Bitrate Video Clips & GIFs',
      color: 'from-slate-700 to-slate-900',
      badge: 'High Bitrate'
    },
    {
      name: 'Pinterest',
      desc: 'Idea Pins, Videos & Animations',
      color: 'from-rose-600 to-red-700',
      badge: 'Direct MP4'
    },
    {
      name: 'Vimeo',
      desc: 'High Definition Cinematic Video',
      color: 'from-teal-500 to-emerald-600',
      badge: 'Pro Quality'
    },
    {
      name: 'SoundCloud',
      desc: 'Lossless Audio Tracks & Music',
      color: 'from-amber-500 to-orange-600',
      badge: '320kbps MP3'
    }
  ];

  return (
    <section className="mt-12 sm:mt-16 space-y-12 sm:space-y-16 border-t border-slate-200 dark:border-white/10 pt-10 sm:pt-14">
      
      {/* 1. HOW IT WORKS: 3 Simple Steps */}
      <div className="space-y-6 text-center">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 font-black text-xs uppercase tracking-wider mb-2 border border-brand-500/20">
            <Zap className="w-3.5 h-3.5 text-brand-500" /> Easy 3-Step Process
          </span>
          <h2 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            How to Download Any Video or Audio in Seconds
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mt-1.5">
            Download your favorite content from YouTube, Instagram, TikTok, Facebook and 1000+ sites with zero quality loss.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
          <div className="p-5 rounded-2xl bg-white dark:bg-[#11192e] border border-slate-200 dark:border-white/5 shadow-sm relative overflow-hidden group hover:border-brand-500/40 transition-all">
            <span className="absolute -top-2 -right-2 text-5xl font-black text-slate-100 dark:text-white/[0.03] select-none">01</span>
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-500 flex items-center justify-center font-black text-base mb-3">
              1
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">Copy Media Link</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Copy the URL of the video, reel, short, or soundtrack from your browser or mobile app.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#11192e] border border-slate-200 dark:border-white/5 shadow-sm relative overflow-hidden group hover:border-brand-500/40 transition-all">
            <span className="absolute -top-2 -right-2 text-5xl font-black text-slate-100 dark:text-white/[0.03] select-none">02</span>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-500 flex items-center justify-center font-black text-base mb-3">
              2
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">Choose Quality & Format</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Paste into OmniDownloader and pick your desired resolution (4K, 1080p, 720p, or 320kbps MP3).
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#11192e] border border-slate-200 dark:border-white/5 shadow-sm relative overflow-hidden group hover:border-brand-500/40 transition-all">
            <span className="absolute -top-2 -right-2 text-5xl font-black text-slate-100 dark:text-white/[0.03] select-none">03</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center font-black text-base mb-3">
              3
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">Instant High-Speed Download</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Click Download and enjoy superfast speeds. Transfer directly to your phone via instant QR code!
            </p>
          </div>
        </div>
      </div>

      {/* 2. SUPPORTED PLATFORMS HUB */}
      <div className="space-y-6">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-black text-xs uppercase tracking-wider mb-2 border border-purple-500/20">
            <Globe className="w-3.5 h-3.5 text-purple-500" /> Multi-Platform Compatibility
          </span>
          <h2 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Supported Social Media & Video Platforms
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mt-1.5">
            Download high-definition videos and lossless audio from every major video network.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {platforms.map((p) => (
            <div
              key={p.name}
              className="p-4 rounded-2xl bg-white dark:bg-[#11192e] border border-slate-200 dark:border-white/5 shadow-sm hover:scale-[1.02] transition-transform flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">{p.name}</h3>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full text-white bg-gradient-to-r ${p.color}`}>
                    {p.badge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  {p.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. CORE BENEFITS & FEATURE BADGES */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center sm:text-left">
          <div className="space-y-1">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-2 mx-auto sm:mx-0">
              <Star className="w-5 h-5 fill-amber-400" />
            </div>
            <h4 className="font-bold text-sm text-white">4K & 8K Ultra HD</h4>
            <p className="text-xs text-slate-400 leading-normal">
              Download videos in crisp original resolution up to 8K 60fps with pure clarity.
            </p>
          </div>

          <div className="space-y-1">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2 mx-auto sm:mx-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-white">Zero Watermarks</h4>
            <p className="text-xs text-slate-400 leading-normal">
              Download Instagram Reels and TikToks clean without logos or watermarks.
            </p>
          </div>

          <div className="space-y-1">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-2 mx-auto sm:mx-0">
              <Music className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-white">320kbps MP3 Audio</h4>
            <p className="text-xs text-slate-400 leading-normal">
              Extract lossless high-bitrate studio quality MP3 tracks from any video.
            </p>
          </div>

          <div className="space-y-1">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-2 mx-auto sm:mx-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-white">Phone QR Transfer</h4>
            <p className="text-xs text-slate-400 leading-normal">
              Scan with your phone camera to transfer downloaded media straight to mobile storage.
            </p>
          </div>
        </div>
      </div>

      {/* 4. GOOGLE RICH SNIPPET FAQ ACCORDION */}
      <div className="space-y-6">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black text-xs uppercase tracking-wider mb-2 border border-emerald-500/20">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" /> Frequently Asked Questions
          </span>
          <h2 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Frequently Asked Questions (FAQ)
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mt-1.5">
            Everything you need to know about downloading videos and converting MP3 audio on OmniDownloader.
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div
                key={faq.question}
                className="rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-[#11192e] overflow-hidden transition-all shadow-sm"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-left gap-4 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                >
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="text-brand-500 font-black">Q.</span>
                    <span>{faq.question}</span>
                  </h3>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${isOpen ? 'rotate-180 text-brand-500' : ''}`} />
                </button>

                {isOpen && (
                  <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-white/5">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </section>
  );
};
