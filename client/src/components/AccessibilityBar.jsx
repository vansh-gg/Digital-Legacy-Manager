import { useEffect, useState } from 'react';
import { Volume2, Square } from 'lucide-react';
import { TEXT_SIZES, usePrefs } from '../context/PrefsContext.jsx';

/** Text-size switch and "Read this page aloud". `tone="light"` for navy backgrounds. */
export function AccessibilityBar({ tone = 'dark' }) {
  const { textSize, setTextSize } = usePrefs();
  const [speaking, setSpeaking] = useState(false);
  const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const light = tone === 'light';

  useEffect(() => () => canSpeak && window.speechSynthesis.cancel(), [canSpeak]);

  const toggleSpeech = () => {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const text = document.getElementById('main')?.innerText || '';
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.lang = 'en-IN';
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  };

  const shell = light ? 'border-white/20 bg-white/10 text-white' : 'border-line bg-white text-ink';
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div role="group" aria-label="Text size" className={`flex items-center rounded-xl border p-1 ${shell}`}>
        <span className={`px-2 text-sm font-bold ${light ? 'text-white/70' : 'text-muted'}`} aria-hidden>Text</span>
        {TEXT_SIZES.map((s, i) => (
          <button
            key={s.value}
            type="button"
            onClick={() => setTextSize(s.value)}
            aria-pressed={textSize === s.value}
            aria-label={`${s.label} text`}
            title={`${s.label} text`}
            className={`min-h-9 min-w-9 rounded-lg px-2 font-bold cursor-pointer transition-colors ${
              textSize === s.value
                ? light
                  ? 'bg-gold text-navy-950'
                  : 'bg-navy-800 text-white'
                : light
                  ? 'hover:bg-white/10'
                  : 'hover:bg-black/5'
            }`}
            style={{ fontSize: `${0.9 + i * 0.18}rem` }}
          >
            A
          </button>
        ))}
      </div>
      {canSpeak && (
        <button
          type="button"
          onClick={toggleSpeech}
          className={`flex min-h-11 items-center gap-2 rounded-xl border px-3 text-sm font-bold cursor-pointer transition-colors ${shell} ${
            light ? 'hover:bg-white/20' : 'hover:border-navy-700'
          }`}
        >
          {speaking ? <Square className="size-4" aria-hidden /> : <Volume2 className="size-4" aria-hidden />}
          {speaking ? 'Stop reading' : 'Read aloud'}
        </button>
      )}
    </div>
  );
}
