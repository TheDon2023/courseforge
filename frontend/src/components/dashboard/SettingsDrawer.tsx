import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Eye, EyeOff, Trash2, RotateCcw, ChevronDown, Check, CheckCircle, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { AI_MODELS } from './types';
import { testKimiConnection, testOpenRouterConnection, testYouTubeConnection } from '../../lib/AiProvider';
import { maskKey } from '../../lib/aiKeys';
import type { ConnectionTestResult } from '../../lib/AiProvider';
import { StorageManager } from '../../lib/storage';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
  onDeleteAll: () => void;
  onResetProgress: () => void;
}

const easeOut = [0.4, 0, 0.2, 1] as [number, number, number, number];

type TestState = 'idle' | 'testing' | 'done';

export default function SettingsDrawer({ isOpen, onClose, onSave, onDeleteAll, onResetProgress }: SettingsDrawerProps) {
  const [youtubeKey, setYoutubeKey] = useState('');
  const [openrouterKey, setOpenrouterKey] = useState('');
  const [kimiKey, setKimiKey] = useState('');
  const [showYoutubeKey, setShowYoutubeKey] = useState(false);
  const [showRouterKey, setShowRouterKey] = useState(false);
  const [showKimiKey, setShowKimiKey] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>(AI_MODELS[0].value);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [saved, setSaved] = useState(false);

  // Connection test states
  const [ytTest, setYtTest] = useState<TestState>('idle');
  const [ytTestResult, setYtTestResult] = useState<ConnectionTestResult | null>(null);
  const [orTest, setOrTest] = useState<TestState>('idle');
  const [orTestResult, setOrTestResult] = useState<ConnectionTestResult | null>(null);
  const [kimiTest, setKimiTest] = useState<TestState>('idle');
  const [kimiTestResult, setKimiTestResult] = useState<ConnectionTestResult | null>(null);

  useEffect(() => {
    if (isOpen) {
      setYoutubeKey(StorageManager.getApiKey('youtube'));
      setOpenrouterKey(StorageManager.getApiKey('openrouter'));
      setKimiKey(StorageManager.getApiKey('kimi'));
      setSelectedModel(StorageManager.get(StorageManager.keys.preferredModel) || AI_MODELS[0].value);
      // Always reset to hidden mode when panel opens - security
      setShowYoutubeKey(false);
      setShowRouterKey(false);
      setShowKimiKey(false);
      setSaved(false);
      // Reset test states
      setYtTest('idle');
      setYtTestResult(null);
      setOrTest('idle');
      setOrTestResult(null);
      setKimiTest('idle');
      setKimiTestResult(null);
    }
  }, [isOpen]);

  const saveSettings = () => {
    try {
      const ytTrimmed = (youtubeKey || '').trim();
      const orTrimmed = (openrouterKey || '').trim();
      const kTrimmed = (kimiKey || '').trim();
      console.log('[CourseForge] Saving keys...');
      
      StorageManager.setApiKey('youtube', ytTrimmed);
      StorageManager.setApiKey('openrouter', orTrimmed);
      StorageManager.setApiKey('kimi', kTrimmed);
      StorageManager.set(StorageManager.keys.preferredModel, selectedModel);
      
      const verifyYt = StorageManager.getApiKey('youtube');
      console.log('[CourseForge] Saved OK. YT key present:', !!verifyYt, 'Length:', verifyYt?.length);
      
      setSaved(true);
      
      window.setTimeout(() => {
        try {
          setSaved(false);
          if (typeof onSave === 'function') {
            onSave();
          }
          if (typeof onClose === 'function') {
            onClose();
          }
        } catch (e) {
          console.error('[CourseForge] Close error:', e);
        }
      }, 800);
    } catch (e) {
      console.error('[CourseForge] Save failed:', e);
      alert('Save failed: ' + (e as Error).message);
    }
  };

  const handleDeleteAll = () => {
    onDeleteAll();
    setShowDeleteConfirm(false);
  };

  const handleResetProgress = () => {
    onResetProgress();
    setShowResetConfirm(false);
  };

  // â”€â”€â”€ Connection Tests â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const runYouTubeTest = useCallback(async () => {
    setYtTest('testing');
    const result = await testYouTubeConnection(youtubeKey);
    setYtTestResult(result);
    setYtTest('done');
  }, [youtubeKey]);

  const runOpenRouterTest = useCallback(async () => {
    setOrTest('testing');
    const result = await testOpenRouterConnection(openrouterKey);
    setOrTestResult(result);
    setOrTest('done');
  }, [openrouterKey]);

  const runKimiTest = useCallback(async () => {
    setKimiTest('testing');
    const result = await testKimiConnection(kimiKey);
    setKimiTestResult(result);
    setKimiTest('done');
  }, [kimiKey]);

  const renderTestStatus = (test: TestState, result: ConnectionTestResult | null) => {
    if (test === 'testing') {
      return <Loader2 size={14} className="animate-spin" style={{ color: 'var(--cyan)' }} />;
    }
    if (test === 'done' && result) {
      if (result.status === 'connected') {
        return (
          <span className="inline-flex items-center gap-1" style={{ color: '#68D391', fontSize: '0.6875rem' }}>
            <Wifi size={12} /> Connected ({result.latencyMs}ms)
          </span>
        );
      }
      if (result.status === 'no_key') {
        return (
          <span className="inline-flex items-center gap-1" style={{ color: 'var(--stone)', fontSize: '0.6875rem' }}>
            <WifiOff size={12} /> No key
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1" style={{ color: '#FC8181', fontSize: '0.6875rem' }} title={result.error}>
          <WifiOff size={12} /> Failed
        </span>
      );
    }
    return null;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100]"
            style={{ backgroundColor: 'rgba(3, 4, 94, 0.6)' }}
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: easeOut }}
            className="fixed bottom-0 right-0 top-0 z-[101] w-full overflow-y-auto sm:w-[420px]"
            style={{
              backgroundColor: 'var(--deep-blue)',
              borderLeft: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div className="p-8">
              {/* Header */}
              <div className="mb-6 flex items-center justify-between">
                <motion.h2
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1, duration: 0.4, ease: easeOut }}
                  className="font-display text-2xl"
                  style={{ color: 'var(--ice)', fontWeight: 400 }}
                >
                  Settings
                </motion.h2>
                <button
                  onClick={onClose}
                  className="rounded-lg p-1.5 transition-colors hover:bg-white/10"
                  style={{ color: 'var(--cyan)' }}
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Divider */}
              <div className="mb-6 h-px w-full" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />

              {/* YouTube API Key */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15, duration: 0.4, ease: easeOut }}
              >
                <label
                  className="mb-2 block text-xs"
                  style={{ color: 'var(--cyan)', fontFamily: "'Inter', sans-serif", fontWeight: 300 }}
                >
                  YouTube Data API v3 Key
                </label>
                <div className="relative">
                  <input
                    type={showYoutubeKey ? 'text' : 'password'}
                    value={youtubeKey}
                    onChange={(e) => setYoutubeKey(e.target.value)}
                    onBlur={saveSettings}
                    placeholder="Enter your YouTube API key..."
                    className="w-full rounded-xl px-4 py-3 pr-10 text-sm outline-none transition-all focus:ring-2"
                    style={{
                      backgroundColor: 'rgba(0, 0, 0, 0.2)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: 'var(--ice)',
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 300,
                    }}
                  />
                  <button
                    onClick={() => setShowYoutubeKey(!showYoutubeKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--cyan)' }}
                    aria-label={showYoutubeKey ? 'Hide key' : 'Show key'}
                  >
                    {showYoutubeKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {/* Masked display + Test */}
                <div className="mt-2 flex items-center justify-between">
                  <span style={{ color: 'var(--stone)', fontSize: '0.6875rem', fontFamily: "'JetBrains Mono', monospace" }}>
                    {maskKey(youtubeKey)}
                  </span>
                  <button
                    onClick={runYouTubeTest}
                    disabled={ytTest === 'testing'}
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs transition-colors hover:bg-white/10"
                    style={{ color: 'var(--cyan)', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    {ytTest === 'testing' ? <Loader2 size={12} className="animate-spin" /> : <Wifi size={12} />}
                    Test
                  </button>
                </div>
                {renderTestStatus(ytTest, ytTestResult)}
              </motion.div>

              {/* OpenRouter API Key */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.4, ease: easeOut }}
                className="mt-5"
              >
                <label
                  className="mb-2 block text-xs"
                  style={{ color: 'var(--cyan)', fontFamily: "'Inter', sans-serif", fontWeight: 300 }}
                >
                  OpenRouter API Key
                </label>
                <div className="relative">
                  <input
                    type={showRouterKey ? 'text' : 'password'}
                    value={openrouterKey}
                    onChange={(e) => setOpenrouterKey(e.target.value)}
                    onBlur={saveSettings}
                    placeholder="sk-or-v1-..."
                    className="w-full rounded-xl px-4 py-3 pr-10 text-sm outline-none transition-all focus:ring-2"
                    style={{
                      backgroundColor: 'rgba(0, 0, 0, 0.2)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: 'var(--ice)',
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 300,
                    }}
                  />
                  <button
                    onClick={() => setShowRouterKey(!showRouterKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--cyan)' }}
                    aria-label={showRouterKey ? 'Hide key' : 'Show key'}
                  >
                    {showRouterKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span style={{ color: 'var(--stone)', fontSize: '0.6875rem', fontFamily: "'JetBrains Mono', monospace" }}>
                    {maskKey(openrouterKey)}
                  </span>
                  <button
                    onClick={runOpenRouterTest}
                    disabled={orTest === 'testing'}
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs transition-colors hover:bg-white/10"
                    style={{ color: 'var(--cyan)', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    {orTest === 'testing' ? <Loader2 size={12} className="animate-spin" /> : <Wifi size={12} />}
                    Test
                  </button>
                </div>
                {renderTestStatus(orTest, orTestResult)}
                <a
                  href="https://openrouter.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-light transition-colors hover:underline"
                  style={{ color: 'var(--stone)', fontFamily: "'Inter', sans-serif" }}
                >
                  <ExternalLink size={12} />
                  Get your free key at openrouter.ai
                </a>
              </motion.div>

              {/* Kimi API Key */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25, duration: 0.4, ease: easeOut }}
                className="mt-5"
              >
                <label
                  className="mb-2 block text-xs"
                  style={{ color: 'var(--cyan)', fontFamily: "'Inter', sans-serif", fontWeight: 300 }}
                >
                  Kimi API Key (Recommended)
                </label>
                <div className="relative">
                  <input
                    type={showKimiKey ? 'text' : 'password'}
                    value={kimiKey}
                    onChange={(e) => setKimiKey(e.target.value)}
                    onBlur={saveSettings}
                    placeholder="sk-..."
                    className="w-full rounded-xl px-4 py-3 pr-10 text-sm outline-none transition-all focus:ring-2"
                    style={{
                      backgroundColor: 'rgba(0, 0, 0, 0.2)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: 'var(--ice)',
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 300,
                    }}
                  />
                  <button
                    onClick={() => setShowKimiKey(!showKimiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--cyan)' }}
                    aria-label={showKimiKey ? 'Hide key' : 'Show key'}
                  >
                    {showKimiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span style={{ color: 'var(--stone)', fontSize: '0.6875rem', fontFamily: "'JetBrains Mono', monospace" }}>
                    {maskKey(kimiKey)}
                  </span>
                  <button
                    onClick={runKimiTest}
                    disabled={kimiTest === 'testing'}
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs transition-colors hover:bg-white/10"
                    style={{ color: 'var(--cyan)', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    {kimiTest === 'testing' ? <Loader2 size={12} className="animate-spin" /> : <Wifi size={12} />}
                    Test
                  </button>
                </div>
                {renderTestStatus(kimiTest, kimiTestResult)}
                <a
                  href="https://platform.moonshot.cn/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-light transition-colors hover:underline"
                  style={{ color: 'var(--stone)', fontFamily: "'Inter', sans-serif" }}
                >
                  <ExternalLink size={12} />
                  Get your key at platform.moonshot.cn
                </a>
              </motion.div>

              {/* Model Selection */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25, duration: 0.4, ease: easeOut }}
                className="mt-6"
              >
                <label
                  className="mb-2 block text-xs"
                  style={{ color: 'var(--cyan)', fontFamily: "'Inter', sans-serif", fontWeight: 300 }}
                >
                  Preferred AI Model
                </label>
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm transition-all"
                    style={{
                      backgroundColor: 'rgba(0, 0, 0, 0.2)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: 'var(--ice)',
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    <span className="truncate">
                      {AI_MODELS.find((m) => m.value === selectedModel)?.label || selectedModel}
                    </span>
                    <ChevronDown
                      size={16}
                      style={{
                        color: 'var(--cyan)',
                        transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0)',
                        transition: 'transform 0.2s ease',
                      }}
                    />
                  </button>

                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 right-0 z-10 mt-1 overflow-hidden rounded-xl"
                        style={{
                          backgroundColor: 'var(--deep-blue)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                        }}
                      >
                        {AI_MODELS.map((model) => (
                          <button
                            key={model.value}
                            onClick={() => {
                              setSelectedModel(model.value);
                              StorageManager.set(StorageManager.keys.preferredModel, model.value);
                              setDropdownOpen(false);
                            }}
                            className="flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-white/5"
                            style={{
                              color: 'var(--ice)',
                              fontFamily: "'Inter', sans-serif",
                            }}
                          >
                            <div>
                              <div className="text-sm">{model.label}</div>
                              <div className="text-xs" style={{ color: 'var(--stone)' }}>
                                {model.description}
                              </div>
                            </div>
                            {selectedModel === model.value && (
                              <Check size={16} style={{ color: 'var(--sky)' }} />
                            )}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <p
                  className="mt-2 text-xs font-light"
                  style={{ color: 'var(--stone)', fontFamily: "'Inter', sans-serif" }}
                >
                  Faster models = quicker generation. Larger models = better quality.
                </p>
              </motion.div>

              {/* Save Button */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.4, ease: easeOut }}
                className="mt-6"
              >
                <button
                  onClick={saveSettings}
                  className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-medium transition-all"
                  style={{
                    background: saved
                      ? 'linear-gradient(135deg, #38A169, #68D391)'
                      : 'var(--gradient-button)',
                    color: '#FFFFFF',
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  {saved ? (
                    <>
                      <CheckCircle size={18} />
                      Saved! Closing...
                    </>
                  ) : (
                    <>
                      <Check size={18} />
                      Save Keys
                    </>
                  )}
                </button>
              </motion.div>

              {/* Success Toast */}
              <AnimatePresence>
                {saved && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="mt-3 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm"
                    style={{
                      backgroundColor: 'rgba(56, 161, 105, 0.2)',
                      border: '1px solid rgba(56, 161, 105, 0.4)',
                      color: '#68D391',
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    <CheckCircle size={16} />
                    API keys saved successfully
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Danger Zone */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35, duration: 0.4, ease: easeOut }}
                className="mt-12"
              >
                <div
                  className="mb-4 h-px w-full"
                  style={{ backgroundColor: 'rgba(230, 57, 70, 0.3)' }}
                />
                <label
                  className="mb-3 block text-xs"
                  style={{ color: 'var(--accent-red)', fontFamily: "'Inter', sans-serif", fontWeight: 300 }}
                >
                  Danger Zone
                </label>

                {/* Delete All */}
                <div className="flex flex-col gap-3">
                  {!showDeleteConfirm ? (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-normal transition-all hover:brightness-110"
                      style={{
                        backgroundColor: 'var(--accent-red)',
                        color: '#FFFFFF',
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      <Trash2 size={16} />
                      Delete All Courses
                    </button>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="overflow-hidden rounded-xl p-3"
                      style={{ backgroundColor: 'rgba(230, 57, 70, 0.15)' }}
                    >
                      <p className="mb-3 text-center text-sm" style={{ color: 'var(--ice)' }}>
                        Are you sure? This cannot be undone.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={handleDeleteAll}
                          className="flex-1 rounded-lg py-2 text-sm font-normal"
                          style={{
                            backgroundColor: 'var(--accent-red)',
                            color: '#FFFFFF',
                          }}
                        >
                          Yes, Delete All
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(false)}
                          className="flex-1 rounded-lg py-2 text-sm"
                          style={{
                            background: 'rgba(255,255,255,0.1)',
                            color: 'var(--ice)',
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Reset Progress */}
                  {!showResetConfirm ? (
                    <button
                      onClick={() => setShowResetConfirm(true)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-normal transition-all hover:bg-white/10"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'var(--accent-red)',
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      <RotateCcw size={16} />
                      Reset All Progress
                    </button>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="overflow-hidden rounded-xl p-3"
                      style={{ backgroundColor: 'rgba(230, 57, 70, 0.15)' }}
                    >
                      <p className="mb-3 text-center text-sm" style={{ color: 'var(--ice)' }}>
                        Reset all course progress to 0%?
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={handleResetProgress}
                          className="flex-1 rounded-lg py-2 text-sm font-normal"
                          style={{
                            backgroundColor: 'var(--accent-red)',
                            color: '#FFFFFF',
                          }}
                        >
                          Yes, Reset
                        </button>
                        <button
                          onClick={() => setShowResetConfirm(false)}
                          className="flex-1 rounded-lg py-2 text-sm"
                          style={{
                            background: 'rgba(255,255,255,0.1)',
                            color: 'var(--ice)',
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

