import React from 'react';
import { Wifi, Battery, Signal } from 'lucide-react';

interface MobileDeviceFrameProps {
  children: React.ReactNode;
  activeTab: 'translate' | 'contacts' | 'avatar' | 'training';
  onChangeTab: (tab: 'translate' | 'contacts' | 'avatar' | 'training') => void;
  appName?: string;
}

export const MobileDeviceFrame: React.FC<MobileDeviceFrameProps> = ({
  children,
  activeTab,
  onChangeTab,
  appName = 'POLYGLOT'
}) => {
  return (
    <div className="flex items-center justify-center py-4 px-2 w-full">
      {/* Smartphone Outer Chassis */}
      <div className="relative w-full max-w-[390px] h-[810px] bg-slate-950 border-[9px] border-slate-800 rounded-[48px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col ring-1 ring-white/10">
        {/* Dynamic Island / Speaker Notch */}
        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-40 w-28 h-6 bg-black rounded-full flex items-center justify-between px-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800" />
          <div className="w-2 h-2 rounded-full bg-emerald-500/80 animate-pulse" />
        </div>

        {/* Mobile Status Bar */}
        <div className="w-full h-11 px-6 flex items-center justify-between text-[11px] text-slate-300 font-semibold select-none shrink-0 bg-slate-950/80 backdrop-blur-xs z-30">
          <span>9:41</span>
          <div className="flex items-center gap-1.5 text-slate-300">
            <Signal className="w-3.5 h-3.5" />
            <Wifi className="w-3.5 h-3.5" />
            <Battery className="w-4 h-4" />
          </div>
        </div>

        {/* App Content Container */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col bg-slate-900 text-slate-100">
          {children}
        </div>

        {/* Bottom Native Tab Bar */}
        <div className="w-full h-16 bg-slate-950/95 border-t border-slate-800 flex items-center justify-around px-2 shrink-0 z-30">
          <button
            onClick={() => onChangeTab('translate')}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'translate' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="text-[10px]">Translator</span>
          </button>

          <button
            onClick={() => onChangeTab('contacts')}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'contacts' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="text-[10px]">Contacts</span>
          </button>

          <button
            onClick={() => onChangeTab('avatar')}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'avatar' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="text-[10px]">3D Avatar</span>
          </button>

          <button
            onClick={() => onChangeTab('training')}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'training' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="text-[10px]">Agent Lab</span>
          </button>
        </div>

        {/* Home Indicator Bar */}
        <div className="w-full h-3 bg-slate-950 flex items-center justify-center shrink-0">
          <div className="w-32 h-1 bg-slate-600 rounded-full" />
        </div>
      </div>
    </div>
  );
};
