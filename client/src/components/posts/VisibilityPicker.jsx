import React from 'react';
import { Globe, Users, Lock } from 'lucide-react';

export default function VisibilityPicker({ value, onChange }) {
  const options = [
    { id: 'public', label: 'Công khai', desc: 'Mọi người đều xem được', icon: Globe },
    { id: 'private', label: 'Riêng tư', desc: 'Chỉ mình bạn xem được', icon: Lock },
    { id: 'followers', label: 'Chỉ người theo dõi', desc: 'Chỉ người theo dõi bạn xem được', icon: Users },
  ];

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-[#162424] dark:text-[#e8f0f0]">
        Chế độ hiển thị
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((opt) => {
          const Icon = opt.icon;
          const active = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left transition ${
                active
                  ? 'bg-[#1F3333] text-white border-[#1F3333] shadow-md'
                  : 'bg-white/70 dark:bg-[#182828]/70 text-[#162424] dark:text-[#e8f0f0] border-white/60 hover:bg-white'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <div>
                <div className="text-sm font-semibold">{opt.label}</div>
                <div className={`text-xs ${active ? 'text-white/80' : 'text-[#4a6363] dark:text-[#9eb7b8]'}`}>
                  {opt.desc}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}