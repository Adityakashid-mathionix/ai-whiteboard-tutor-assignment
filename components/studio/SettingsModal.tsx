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
      desc: "NVIDIA's official high-speed instruction & visual reasoning model (~1-3s).",
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#121620] border border-[#282d3b] rounded-2xl shadow-2xl overflow-hidden p-6 text-[#f6f4ef]">
        <div className="flex items-center justify-between pb-4 border-b border-[#282d3b]">
          <div className="flex items-center space-x-2">
            <Key className="w-5 h-5 text-electric" />
            <h3 className="text-base font-serif font-bold text-white">AI Provider Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-[#181c28] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 pt-4">
          {/* API Key */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-mono font-semibold text-neutral-300">
                NVIDIA NIM API Key
              </label>
              <a
                href="https://build.nvidia.com"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-mono text-electric hover:underline flex items-center space-x-1"
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
              className="w-full bg-[#141720] border border-[#282d3b] focus:border-electric rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-electric font-mono"
            />
            <p className="text-[11px] text-neutral-400 mt-1.5 flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span>Keys remain server-side and are never exposed in client bundles.</span>
            </p>
          </div>

          {/* Model selection */}
          <div>
            <label className="text-xs font-mono font-semibold text-neutral-300 block mb-2">
              Inference Model
            </label>
            <div className="space-y-2">
              {models.map((m) => (
                <label
                  key={m.id}
                  className={`flex flex-col p-2.5 rounded-xl border text-left cursor-pointer transition-colors ${
                    localModel === m.id
                      ? "bg-[#181c28] border-electric text-white"
                      : "bg-[#141720] border-[#282d3b] hover:bg-[#181c28] text-neutral-400"
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
                      className="text-electric focus:ring-electric"
                    />
                  </div>
                  <span className="text-[10px] text-neutral-400 mt-0.5">{m.desc}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Save Action */}
          <div className="pt-2 flex items-center justify-end space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-mono text-neutral-400 hover:text-white hover:bg-[#181c28] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl text-xs font-mono font-semibold bg-electric hover:bg-[#0a4fbf] text-white transition-colors flex items-center space-x-1.5 shadow-md shadow-electric/30"
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
