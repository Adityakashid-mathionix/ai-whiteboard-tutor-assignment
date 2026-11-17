"use client";

import React, { useState, useEffect } from "react";
import { Key, X, Check, ExternalLink, ShieldCheck } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSaveApiKey: (key: string) => void;
  selectedModel: string;
  onSaveModel: (model: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  onSaveApiKey,
  selectedModel,
  onSaveModel,
}) => {
  const [localKey, setLocalKey] = useState(apiKey);
  const [localModel, setLocalModel] = useState(selectedModel);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setLocalKey(apiKey);
    setLocalModel(selectedModel);
  }, [apiKey, selectedModel, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveApiKey(localKey.trim());
    onSaveModel(localModel);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  const models = [
    {
      id: "nvidia/nemotron-3.5-lightning-30b-a3b",
      name: "NVIDIA Nemotron 3.5 Lightning (Recommended)",
      desc: "NVIDIA's official high-speed instruction & visual reasoning model.",
    },
    {
      id: "nvidia/nemotron-3.5-bolt-e4b",
      name: "NVIDIA Nemotron 3.5 Bolt",
      desc: "Ultra-fast low-latency reasoning model.",
    },
    {
      id: "stepfun-ai/step-5-preview",
      name: "StepFun Step 5",
      desc: "Advanced reasoning and deep curriculum explanations.",
    },
    {
      id: "minimaxai/minimax-m3.1-flash",
      name: "MiniMax M3.1 Flash",
      desc: "Balanced speed and detailed teaching synthesis.",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 text-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Key className="w-5 h-5 text-sky-400" />
            <h3 className="text-base font-bold text-white">AI Provider Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 pt-4">
          {/* API Key */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                NVIDIA NIM API Key
              </label>
              <a
                href="https://build.nvidia.com"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-sky-400 hover:underline flex items-center space-x-1"
              >
                <span>Get free key</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <input
              type="password"
              value={localKey}
              onChange={(e) => setLocalKey(e.target.value)}
              placeholder="nvapi-..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono"
            />
            <p className="text-[11px] text-slate-400 mt-1.5 flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span>Keys are sent directly via server route and never exposed on frontend.</span>
            </p>
          </div>

          {/* Model selection */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">
              Inference Model
            </label>
            <div className="space-y-2">
              {models.map((m) => (
                <label
                  key={m.id}
                  className={`flex flex-col p-2.5 rounded-xl border text-left cursor-pointer transition-colors ${
                    localModel === m.id
                      ? "bg-slate-800/80 border-sky-500/80 text-white"
                      : "bg-slate-950/50 border-slate-800 hover:bg-slate-800/40 text-slate-400"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">{m.name}</span>
                    <input
                      type="radio"
                      name="model"
                      value={m.id}
                      checked={localModel === m.id}
                      onChange={() => setLocalModel(m.id)}
                      className="text-sky-500 focus:ring-sky-500"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5">{m.desc}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Save Action */}
          <div className="pt-2 flex items-center justify-end space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-slate-950 transition-colors flex items-center space-x-1.5"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Saved</span>
                </>
              ) : (
                <span>Save Settings</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
