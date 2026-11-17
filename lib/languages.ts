export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  speechLang: string;
  dir?: "ltr" | "rtl";
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  {
    code: "en",
    name: "English",
    nativeName: "English",
    flag: "🇺🇸",
    speechLang: "en-US",
  },
  {
    code: "hi",
    name: "Hindi",
    nativeName: "हिन्दी",
    flag: "🇮🇳",
    speechLang: "hi-IN",
  },
  {
    code: "mr",
    name: "Marathi",
    nativeName: "मराठी",
    flag: "🇮🇳",
    speechLang: "mr-IN",
  },
  {
    code: "gu",
    name: "Gujarati",
    nativeName: "ગુજરાતી",
    flag: "🇮🇳",
    speechLang: "gu-IN",
  },
  {
    code: "de",
    name: "German",
    nativeName: "Deutsch",
    flag: "🇩🇪",
    speechLang: "de-DE",
  },
  {
    code: "es",
    name: "Spanish",
    nativeName: "Español",
    flag: "🇪🇸",
    speechLang: "es-ES",
  },
  {
    code: "fr",
    name: "French",
    nativeName: "Français",
    flag: "🇫🇷",
    speechLang: "fr-FR",
  },
  {
    code: "ja",
    name: "Japanese",
    nativeName: "日本語",
    flag: "🇯🇵",
    speechLang: "ja-JP",
  },
];

export type LearningLevel = "beginner" | "intermediate" | "advanced";

export const LEARNING_LEVELS: { id: LearningLevel; label: string; desc: string }[] = [
  { id: "beginner", label: "Foundational", desc: "Intuitive analogies & fundamental concepts" },
  { id: "intermediate", label: "Core Academic", desc: "Detailed mechanisms & balanced rigor" },
  { id: "advanced", label: "Deep Dive", desc: "Technical depth, architecture & formal proofs" },
];

export function getLanguageByCode(code: string): LanguageOption {
  return SUPPORTED_LANGUAGES.find((lang) => lang.code === code) || SUPPORTED_LANGUAGES[0];
}
