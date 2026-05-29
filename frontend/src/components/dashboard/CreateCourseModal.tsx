import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Search,
  AlertCircle,
  ChevronDown,
  Check,
  Settings as SettingsIcon,
} from 'lucide-react';
import type { YouTubeChannelInfo } from './types';
import { AI_MODELS } from './types';
import { fetchYouTubeChannelInfo } from './api';
import type { ChannelSearchResult } from './api';
import { StorageManager } from '../../lib/storage';

interface CreateCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (result: ChannelSearchResult) => void;
}

const easeSpring = [0.34, 1.56, 0.64, 1] as [number, number, number, number];
const easeOut = [0.4, 0, 0.2, 1] as [number, number, number, number];

export default function CreateCourseModal({ isOpen, onClose, onSubmit }: CreateCourseModalProps) {
  const [url, setUrl] = useState('');
  const [channelInfo, setChannelInfo] = useState<YouTubeChannelInfo | null>(null);
  const [searchResult, setSearchResult] = useState<ChannelSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedModel, setSelectedModel] = useState(() =>
    StorageManager.get(StorageManager.keys.preferredModel) || AI_MODELS[0].value
  );
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [youtubeKey, setYoutubeKey] = useState('');
  const [openrouterKey, setOpenrouterKey] = useState('');

  useEffect(() => {
    if (isOpen) {
      setUrl('');
      setChannelInfo(null);
      setSearchResult(null);
      setError('');
      setLoading(false);
      setYoutubeKey(StorageManager.getApiKey('youtube'));
      setOpenrouterKey(StorageManager.getApiKey('openrouter'));
    }
  }, [isOpen]);

  const handleSearch = useCallback(async () => {
    if (!url.trim()) return;

    setLoading(true);
    setError('');
    setChannelInfo(null);
    setSearchResult(null);

    const result = await fetchYouTubeChannelInfo(url.trim());

    if (result.error) {
      setError(result.error);
    } else if (result.info) {
      setChannelInfo(result.info);
      setSearchResult(result);
    } else {
      setError('Could not find that channel or playlist. Please check the URL and try again.');
    }

    setLoading(false);
  }, [url]);

  const handleSubmit = () => {
    if (!searchResult) return;
    // Save settings
    StorageManager.set(StorageManager.keys.preferredModel, selectedModel);
    StorageManager.setApiKey('youtube', youtubeKey);
    StorageManager.setApiKey('openrouter', openrouterKey);
    onSubmit(searchResult);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: easeOut }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ backgroundColor: 'var(--overlay-dark)', backdropFilter: 'blur(12px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: easeSpring }}
            className="relative w-full max-w-[560px] rounded-[20px] p-8"
            style={{
              backgroundColor: 'var(--abyss)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
            }}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-lg p-1.5 transition-colors hover:bg-white/10"
              style={{ color: 'var(--stone)' }}
              aria-label="Close"
            >
              <X size={20} />
            </button>

            {/* Settings Button */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="absolute left-4 top-4 rounded-lg p-1.5 transition-colors hover:bg-white/10"
              style={{ color: 'var(--stone)' }}
              aria-label="Settings"
            >
              <SettingsIcon size={18} />
            </button>

            {/* Title */}
            <h2
              className="mt-4 text-center font-display text-2xl"
              style={{ color: 'var(--ice)', fontWeight: 400 }}
            >
              Create New Course
            </h2>
            <p
              className="mt-2 text-center text-sm font-light"
              style={{
                color: 'var(--cyan)',
                fontFamily: "'Inter', sans-serif",
                fontWeight: 300,
              }}
            >
              Paste a YouTube video URL, playlist URL, channel URL, or search by name
            </p>

            {/* Settings Panel */}
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: easeOut }}
                  className="mt-4 overflow-hidden rounded-xl"
                  style={{
                    background: 'rgba(2, 62, 138, 0.4)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <div className="p-4">
                    <h4
                      className="mb-3 text-xs uppercase tracking-[0.15em]"
                      style={{ color: 'var(--sky)', fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      API Configuration
                    </h4>
                    <div className="flex flex-col gap-3">
                      <div>
                        <label className="mb-1 block text-xs" style={{ color: 'var(--cyan)' }}>
                          YouTube API Key
                        </label>
                        <input
                          type="password"
                          value={youtubeKey}
                          onChange={(e) => setYoutubeKey(e.target.value)}
                          placeholder="Enter YouTube API key..."
                          className="w-full rounded-xl px-3 py-2 text-sm outline-none transition-all focus:ring-2"
                          style={{
                            backgroundColor: 'rgba(0, 0, 0, 0.2)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'var(--ice)',
                            fontFamily: "'Inter', sans-serif",
                            fontWeight: 300,
                          }}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs" style={{ color: 'var(--cyan)' }}>
                          OpenRouter API Key
                        </label>
                        <input
                          type="password"
                          value={openrouterKey}
                          onChange={(e) => setOpenrouterKey(e.target.value)}
                          placeholder="Enter OpenRouter API key..."
                          className="w-full rounded-xl px-3 py-2 text-sm outline-none transition-all focus:ring-2"
                          style={{
                            backgroundColor: 'rgba(0, 0, 0, 0.2)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'var(--ice)',
                            fontFamily: "'Inter', sans-serif",
                            fontWeight: 300,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Search Input */}
            <div className="mt-6 flex gap-2">
              <div className="relative flex-1">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--cyan)', opacity: 0.5 }}
                />
                <input
                  type="text"
                  value={url}
                  onChange={(e) => { setUrl(e.target.value); setError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Enter YouTube video, playlist, channel URL, or name..."
                  className="w-full rounded-xl py-3 pl-10 pr-4 text-sm outline-none transition-all focus:ring-2"
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'var(--ice)',
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 300,
                    fontSize: '0.9375rem',
                  }}
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSearch}
                disabled={loading || !url.trim()}
                className="inline-flex h-[46px] w-[46px] items-center justify-center rounded-xl transition-all disabled:opacity-50"
                style={{
                  background: 'var(--gradient-accent)',
                  color: 'var(--deep-ink)',
                }}
              >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="h-4 w-4 rounded-full border-2 border-t-transparent"
                    style={{ borderColor: 'var(--deep-ink)', borderTopColor: 'transparent' }}
                  />
                ) : (
                  <Search size={18} />
                )}
              </motion.button>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-3 flex items-center gap-2 rounded-lg px-3 py-2"
                  style={{ backgroundColor: 'rgba(230, 57, 70, 0.15)' }}
                >
                  <AlertCircle size={16} style={{ color: 'var(--accent-red)', flexShrink: 0 }} />
                  <span
                    className="text-sm font-light"
                    style={{ color: 'var(--accent-red)' }}
                  >
                    {error}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Channel Preview */}
            <AnimatePresence>
              {channelInfo && (
                <motion.div
                  initial={{ opacity: 0, y: 10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: 10, height: 0 }}
                  transition={{ duration: 0.3, ease: easeOut }}
                  className="mt-4 overflow-hidden"
                >
                  <div
                    className="rounded-xl p-4"
                    style={{
                      background: 'rgba(2, 62, 138, 0.4)',
                      backdropFilter: 'blur(16px)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={channelInfo.thumbnail}
                        alt={channelInfo.name}
                        className="h-12 w-12 rounded-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/logo.png';
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <h3
                          className="truncate text-base font-normal"
                          style={{ color: 'var(--ice)', fontFamily: "'Inter', sans-serif" }}
                        >
                          {channelInfo.name}
                          {searchResult?.isPlaylist && (
                            <span
                              className="ml-2 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide"
                              style={{ backgroundColor: '#00FF0020', color: '#00FF00', border: '1px solid #00FF0040' }}
                            >
                              Playlist
                            </span>
                          )}
                        </h3>
                        <p
                          className="text-xs"
                          style={{ color: 'var(--cyan)', fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          {channelInfo.handle}
                        </p>
                        <p
                          className="mt-0.5 text-xs font-light"
                          style={{ color: 'var(--stone)', fontFamily: "'Inter', sans-serif" }}
                        >
                          {channelInfo.demo ? (
                            <span style={{ color: 'var(--cyan)', fontStyle: 'italic' }}>Demo preview â€” Add API key for real stats</span>
                          ) : (
                            <>{channelInfo.videoCount} videos &bull; {channelInfo.subscriberCount} subscribers</>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Model Selection */}
            {channelInfo && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="relative mt-4"
              >
                <label
                  className="mb-2 block text-xs"
                  style={{ color: 'var(--cyan)', fontFamily: "'Inter', sans-serif", fontWeight: 300 }}
                >
                  AI Model
                </label>
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
                  <span>
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
                            setDropdownOpen(false);
                          }}
                          className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors hover:bg-white/5"
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
              </motion.div>
            )}

            {/* Action Buttons */}
            {channelInfo && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-6 flex flex-col gap-3"
              >
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleSubmit}
                  className="w-full rounded-xl py-3 text-sm font-normal transition-shadow"
                  style={{
                    background: 'var(--gradient-accent)',
                    color: 'var(--deep-ink)',
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  Generate Course
                </motion.button>
                <button
                  onClick={onClose}
                  className="w-full rounded-xl py-3 text-sm font-normal transition-colors"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'var(--ice)',
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  Cancel
                </button>
              </motion.div>
            )}

            {/* Helper text for search */}
            {!channelInfo && !error && (
              <div className="mt-4 flex items-start gap-2">
                <AlertCircle size={14} style={{ color: 'var(--stone)', flexShrink: 0, marginTop: 2 }} />
                <p
                  className="text-xs font-light"
                  style={{ color: 'var(--stone)', fontFamily: "'Inter', sans-serif" }}
                >
                  Examples: youtube.com/watch?v=VIDEO_ID, youtu.be/VIDEO_ID, youtube.com/@channelname, or playlist URL.
                  No API key? A demo course will be created.
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

