import React from 'react';
import { LayoutGrid, Sparkles, ArrowRight, Music } from 'lucide-react';
import { PromptTemplate } from '../types';

interface TemplatesViewProps {
  templates: PromptTemplate[];
  onUseTemplate: (template: PromptTemplate) => void;
}

export const TemplatesView: React.FC<TemplatesViewProps> = ({ templates, onUseTemplate }) => {
  return (
    <div className="space-y-8 pb-28">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-[#FF7A00] text-xs font-bold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>16 PRESETS PROFESSIONNELS</span>
        </div>
        <h1 className="text-3xl font-black text-[#0F172A] tracking-tight">
          Templates & Presets de Prompts
        </h1>
        <p className="text-sm text-[#64748B] mt-1">
          Gagnez du temps avec nos structures musicales éprouvées créées par des producteurs professionnels.
        </p>
      </div>

      {/* Grid of 16 Templates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {templates.map((tpl) => (
          <div
            key={tpl.id}
            className="p-5 rounded-3xl bg-white border border-slate-200/90 hover:border-[#FF7A00] hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-[#EFF6FF] text-[#2563EB]">
                  {tpl.genre}
                </span>
                <span className="text-xs text-slate-400">Preset Studio</span>
              </div>

              <h3 className="font-extrabold text-base text-[#0F172A] group-hover:text-[#FF7A00] transition-colors">
                {tpl.title}
              </h3>
              <p className="text-xs text-[#64748B] mt-1 line-clamp-2">
                {tpl.description}
              </p>

              <div className="mt-3.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 text-xs italic font-medium line-clamp-3">
                « {tpl.prompt} »
              </div>
            </div>

            <button
              onClick={() => onUseTemplate(tpl)}
              className="mt-4 w-full py-2.5 rounded-xl bg-slate-100 hover:bg-[#FF7A00] text-[#0F172A] hover:text-white font-extrabold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Use Template</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
