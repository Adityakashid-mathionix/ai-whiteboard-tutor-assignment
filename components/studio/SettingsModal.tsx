"use client";

import React, { useEffect, useState } from "react";
import { Check, ExternalLink, Key, Mic2, Play, X } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSaveApiKey: (key: string) => void;
  selectedModel: string;
  onSaveModel: (model: string) => void;
  /** Voices the browser offers for narration. */
  voices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  onSelectVoice: (voice: SpeechSynthesisVoice | null) => void;
  onPreviewVoice: (voice: SpeechSynthesisVoice | null) => void;
}

const MODELS = [
  {
    id: "nvidia/nemotron-3.5-lightning-30b-a3b",
    name: "Nemotron 3.5 Lightning",
    desc: "Recommended. Fast, and reliable at structured output.",
  },
  {
    id: "nvidia/nemotron-3.5-bolt-e4b",
    name: "Nemotron 3.5 Bolt",
    desc: "Lowest latency, shorter lessons.",
  },
  {
    id: "stepfun-ai/step-5-preview",
    name: "StepFun Step 5",
    desc: "Slower, stronger on deep technical topics.",
  },
  {
    id: "minimaxai/minimax-m3.1-flash",
    name: "MiniMax M3.1 Flash",
    desc: "Balanced speed and detail.",
  },
];

/** Turns "Microsoft Aria Online (Natural) - English (United States)" into "Aria". */
function shortVoiceName(voice: SpeechSynthesisVoice): string {
  const trimmed = voice.name
    .replace(/^(Microsoft|Google|Apple)\s+/i, "")
    .replace(/\s*\((Natural|Enhanced|Premium)\)/i, "")
    .replace(/\s*Online.*$/i, "")
    .replace(/\s*-\s*English.*$/i, "")
    .trim();
  return trimmed || voice.name;
}

function voiceQuality(voice: SpeechSynthesisVoice): string | null {
  if (/natural|neural|wavenet/i.test(voice.name)) return "natural";
  if (/enhanced|premium/i.test(voice.name)) return "enhanced";
  return null;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  onSaveApiKey,
  selectedModel,
  onSaveModel,
  voices,
  selectedVoice,
  onSelectVoice,
  onPreviewVoice,
}) => {
  const [localKey, setLocalKey] = useState(apiKey);
  const [localModel, setLocalModel] = useState(selectedModel);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setLocalKey(apiKey);
    setLocalModel(selectedModel);
  }, [apiKey, selectedModel, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

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

  // English voices first; the narration is written in English.
  const englishVoices = voices.filter((v) => v.lang.toLowerCase().startsWith("en"));
  const voiceList = englishVoices.length > 0 ? englishVoices : voices;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-xl border border-border bg-paper p-6 shadow-lift"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Studio settings"
      >
        <div className="flex items-center justify-between border-b border-border pb-4">
          <h3 className="handwritten text-2xl">Settings</h3>
          <button
            onClick={onClose}
            aria-label="Close settings"
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Narration voice */}
        <section className="py-5">
          <p className="eyebrow flex items-center gap-1.5">
            <Mic2 className="h-3 w-3" />
            tutor voice
          </p>

          {voiceList.length === 0 ? (
            <p className="mt-2 text-[13px] text-muted-foreground">
              Your browser has not offered any voices yet. Try reopening this panel in a
              moment, or use Chrome or Edge for the natural-sounding ones.
            </p>
          ) : (
            <>
              <div className="mt-2 flex items-center gap-2">
                <select
                  value={selectedVoice?.name || ""}
                  onChange={(e) => {
                    const voice = voiceList.find((v) => v.name === e.target.value) || null;
                    onSelectVoice(voice);
                    onPreviewVoice(voice);
                  }}
                  className="min-w-0 flex-1 rounded-lg border border-border bg-paper-warm px-3 py-2 text-[13px] text-foreground focus:border-electric focus:outline-none"
                >
                  {voiceList.map((voice) => {
                    const quality = voiceQuality(voice);
                    return (
                      <option key={voice.name} value={voice.name}>
                        {shortVoiceName(voice)}
                        {quality ? ` · ${quality}` : ""} ({voice.lang})
                      </option>
                    );
                  })}
                </select>

                <button
                  onClick={() => onPreviewVoice(selectedVoice)}
                  title="Hear this voice"
                  className="btn-interactive flex items-center gap-1.5 rounded-lg border border-border bg-paper px-3 py-2 font-mono text-[11px] text-foreground/80"
                >
                  <Play className="h-3 w-3 text-electric" />
                  test
                </button>
              </div>

              <p className="mt-2 text-[12px] leading-snug text-muted-foreground">
                Voices come from your own device, so the list differs per browser. The ones
                marked <span className="font-mono text-[11px]">natural</span> sound closest
                to a person. Your choice is remembered.
              </p>
            </>
          )}
        </section>

        {/* API key */}
        <section className="border-t border-border py-5">
          <label htmlFor="api-key" className="eyebrow flex items-center gap-1.5">
            <Key className="h-3 w-3" />
            your nvidia api key
          </label>
          <input
            id="api-key"
            type="password"
            value={localKey}
            onChange={(e) => setLocalKey(e.target.value)}
            placeholder="nvapi-..."
            className="mt-2 w-full rounded-lg border border-border bg-paper-warm px-3 py-2 font-mono text-[13px] text-foreground placeholder-muted-foreground/60 focus:border-electric focus:outline-none"
          />
          <p className="mt-2 text-[12px] leading-snug text-muted-foreground">
            Optional. Without one, lessons use the deployment&apos;s shared key, which is
            rate limited. The key is stored in this browser only and sent to this app&apos;s
            own API route.{" "}
            <a
              href="https://build.nvidia.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 text-electric hover:underline"
            >
              get a free key
              <ExternalLink className="h-3 w-3" />
            </a>
          </p>
        </section>

        {/* Model */}
        <section className="border-t border-border py-5">
          <p className="eyebrow">model</p>
          <div className="mt-2 space-y-1.5">
            {MODELS.map((model) => (
              <button
                key={model.id}
                onClick={() => setLocalModel(model.id)}
                className={`w-full rounded-lg border px-3 py-2.5 text-left transition-colors ${
                  localModel === model.id
                    ? "border-electric bg-electric/5"
                    : "border-border bg-paper hover:bg-muted"
                }`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-semibold">{model.name}</span>
                  {localModel === model.id && <Check className="h-3.5 w-3.5 text-electric" />}
                </span>
                <span className="mt-0.5 block text-[12px] text-muted-foreground">
                  {model.desc}
                </span>
              </button>
            ))}
          </div>
        </section>

        <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-2 font-mono text-xs text-muted-foreground hover:text-foreground"
          >
            cancel
          </button>
          <button
            onClick={handleSave}
            className="btn-interactive flex items-center gap-1.5 rounded-lg bg-electric px-4 py-2 font-mono text-xs font-semibold text-white"
          >
            {savedSuccess ? <Check className="h-3.5 w-3.5" /> : null}
            {savedSuccess ? "saved" : "save"}
          </button>
        </div>
      </div>
    </div>
  );
};
