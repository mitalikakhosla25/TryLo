/**
 * TryLo Timestamped Video Player & Bug Review Theater
 * Supports jumping to reproduction timestamps, playback speed controls, and founder annotations.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Clock,
  Download,
  Plus,
  CheckCircle2,
  Film,
  Volume2,
  VolumeX,
  Maximize2,
  Sparkles,
  Flame,
  Mic,
} from 'lucide-react';
import { useAddTimestampedVideoNote, useVideoAiInsights } from '../../context/useFeedback';
import type { TimestampedNote } from '../../api/feedback';

interface TimestampedVideoPlayerProps {
  feedbackId: string;
  videoUrl: string;
  initialNotes?: TimestampedNote[];
  isFounder?: boolean;
}

export const TimestampedVideoPlayer: React.FC<TimestampedVideoPlayerProps> = ({
  feedbackId,
  videoUrl,
  initialNotes = [],
  isFounder = false,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [notes, setNotes] = useState<TimestampedNote[]>(initialNotes);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [activeSideTab, setActiveSideTab] = useState<'notes' | 'ai_voice'>('notes');

  const { data: aiVideo } = useVideoAiInsights(feedbackId);

  // Founder new note form state
  const [newNoteText, setNewNoteText] = useState<string>('');
  const [newNoteTag, setNewNoteTag] = useState<string>('root_cause');
  const [addSuccessMsg, setAddSuccessMsg] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerContainerRef = useRef<HTMLDivElement | null>(null);

  const { mutateAsync: addNote, isPending: isAddingNote } = useAddTimestampedVideoNote(feedbackId);

  useEffect(() => {
    setNotes(initialNotes);
  }, [initialNotes]);

  const formatTime = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.floor(totalSeconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const cur = videoRef.current.currentTime;
    setCurrentTime(cur);

    // Identify if currently near an annotation (within 3 seconds)
    const match = notes.find(
      (n) => Math.abs(n.timestamp_seconds - cur) <= 3
    );
    setActiveNoteId(match?.id ?? null);
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const seekTo = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = seconds;
    videoRef.current.play();
    setIsPlaying(true);
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = Number(e.target.value);
    seekTo(targetTime);
  };

  const changeSpeed = (rate: number) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = rate;
    setPlaybackRate(rate);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      playerContainerRef.current.requestFullscreen();
    }
  };

  const handleAddAnnotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    const snapSecond = Math.floor(currentTime);
    try {
      const res = await addNote({
        feedbackId,
        payload: {
          timestamp_seconds: snapSecond,
          timestamp_display: formatTime(snapSecond),
          note: newNoteText.trim(),
          tag: newNoteTag,
        },
      });

      setNotes(res.timestamped_notes);
      setNewNoteText('');
      setAddSuccessMsg(`Annotation pinned at ${formatTime(snapSecond)}`);
      setTimeout(() => setAddSuccessMsg(null), 3000);
    } catch {
      // Handled by react query
    }
  };

  const getTagColor = (tag?: string | null) => {
    switch (tag) {
      case 'crash':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'ui_glitch':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'console_error':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'root_cause':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      default:
        return 'bg-[#E6F4F1] text-[#07545A] border-[#BCE1D8]';
    }
  };

  return (
    <div className="rounded-3xl border border-[#DCE7E3] bg-white overflow-hidden shadow-xs space-y-4 p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#DCE7E3]">
        <div className="flex items-center space-x-2.5">
          <div className="h-8 w-8 rounded-xl bg-[#E6F4F1] border border-[#BCE1D8] flex items-center justify-center text-[#07545A]">
            <Film className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#102A35]">
              Reproduction Recording &amp; Interactive Timeline
            </h3>
            <p className="text-[11px] text-[#52656B]">
              Jump to marked timestamps to observe the exact bug trigger.
            </p>
          </div>
        </div>

        <a
          href={videoUrl}
          download="bug_reproduction.webm"
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#F6F5ED] hover:bg-[#EBE9DF] border border-[#DCE7E3] text-[#102A35] transition-colors"
          title="Download original video file"
        >
          <Download className="h-3.5 w-3.5 text-[#087C80]" />
          <span>Download Video</span>
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Video Theater (Col 7) */}
        <div className="lg:col-span-7 space-y-3">
          <div
            ref={playerContainerRef}
            className="rounded-2xl overflow-hidden bg-black border border-[#102A35]/20 aspect-video relative flex items-center justify-center group"
          >
            <video
              ref={videoRef}
              src={videoUrl}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={() => setIsPlaying(false)}
              className="w-full h-full object-contain"
              playsInline
            />

            {/* Center Big Play Button Overlay when Paused */}
            {!isPlaying && (
              <button
                type="button"
                onClick={togglePlay}
                className="absolute inset-0 m-auto h-14 w-14 rounded-full bg-white/80 hover:bg-white text-[#07545A] flex items-center justify-center shadow-lg transition-transform hover:scale-105 cursor-pointer backdrop-blur-xs"
              >
                <Play className="h-6 w-6 fill-current translate-x-0.5" />
              </button>
            )}
          </div>

          {/* Custom Controls Bar */}
          <div className="p-3 bg-[#F6F5ED] rounded-2xl border border-[#DCE7E3] space-y-2">
            {/* Scrubber Range Bar */}
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-mono font-bold text-[#102A35] w-9">
                {formatTime(currentTime)}
              </span>
              <input
                type="range"
                min="0"
                max={duration || 100}
                step="0.1"
                value={currentTime}
                onChange={handleSeekChange}
                className="w-full h-1.5 bg-[#DCE7E3] rounded-lg appearance-none cursor-pointer accent-[#087C80]"
              />
              <span className="text-[11px] font-mono text-[#52656B] w-9 text-right">
                {formatTime(duration)}
              </span>
            </div>

            {/* AI Frustration Timeline Heatmap Bar */}
            {aiVideo?.segments && aiVideo.segments.length > 0 && (
              <div className="space-y-1 pt-1.5 border-t border-[#DCE7E3]/60">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-extrabold uppercase tracking-wider text-[#07545A] flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-[#168B98]" />
                    <span>AI Frustration Heatmap</span>
                  </span>
                  <span className="text-[#52656B]">
                    Peak Friction: <strong className="text-rose-600">{aiVideo.peak_frustration_timestamp}</strong> ({aiVideo.average_frustration_score}/10 avg)
                  </span>
                </div>
                <div className="relative h-2 bg-slate-200/90 rounded-full overflow-hidden flex items-center">
                  {aiVideo.segments.map((seg, idx) => {
                    const leftPct = duration > 0 ? (seg.timestamp_seconds / duration) * 100 : (idx + 1) * 18;
                    const heatColor =
                      seg.frustration_intensity >= 8
                        ? 'bg-rose-500'
                        : seg.frustration_intensity >= 5
                        ? 'bg-amber-400'
                        : 'bg-emerald-400';

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => seekTo(seg.timestamp_seconds)}
                        title={`At ${seg.timestamp_display}: "${seg.spoken_transcript}" (Intensity: ${seg.frustration_intensity}/10)`}
                        className={`absolute -translate-x-1/2 h-full w-3.5 rounded-full ${heatColor} hover:scale-125 transition-transform cursor-pointer shadow-xs`}
                        style={{ left: `${Math.min(98, Math.max(2, leftPct))}%` }}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Playback Controls & Speed */}
            <div className="flex items-center justify-between text-xs pt-1">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={togglePlay}
                  className="p-1.5 rounded-lg bg-white border border-[#DCE7E3] text-[#102A35] hover:bg-[#EFEFE5] transition-colors cursor-pointer"
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
                </button>

                <button
                  type="button"
                  onClick={() => seekTo(0)}
                  className="p-1.5 rounded-lg bg-white border border-[#DCE7E3] text-[#52656B] hover:text-[#102A35] transition-colors cursor-pointer"
                  title="Restart video"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={toggleMute}
                  className="p-1.5 rounded-lg bg-white border border-[#DCE7E3] text-[#52656B] hover:text-[#102A35] transition-colors cursor-pointer"
                >
                  {isMuted ? <VolumeX className="h-4 w-4 text-rose-600" /> : <Volume2 className="h-4 w-4" />}
                </button>
              </div>

              {/* Speed Buttons */}
              <div className="flex items-center space-x-1">
                {[1, 1.25, 1.5, 2].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => changeSpeed(rate)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                      playbackRate === rate
                        ? 'bg-[#07545A] text-white'
                        : 'bg-white text-[#52656B] hover:text-[#102A35] border border-[#DCE7E3]'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}

                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="p-1 rounded-md text-[#52656B] hover:text-[#102A35] transition-colors ml-1"
                  title="Fullscreen"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Timestamped Notes & AI Voice Intelligence (Col 5) */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            {/* Tab Selector */}
            <div className="flex items-center justify-between pb-1.5 border-b border-[#DCE7E3]">
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() => setActiveSideTab('notes')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeSideTab === 'notes'
                      ? 'bg-[#07545A] text-white shadow-2xs'
                      : 'text-[#52656B] hover:text-[#102A35]'
                  }`}
                >
                  Notes ({notes.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSideTab('ai_voice')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    activeSideTab === 'ai_voice'
                      ? 'bg-[#07545A] text-white shadow-2xs'
                      : 'text-[#52656B] hover:text-[#102A35]'
                  }`}
                >
                  <Mic className="h-3 w-3" />
                  <span>AI Voice Track</span>
                  {aiVideo?.segments && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-0.5 animate-pulse" />
                  )}
                </button>
              </div>
              <span className="text-[10px] text-[#52656B]">Click to jump video</span>
            </div>

            {/* TAB 1: Reproduction Markers */}
            {activeSideTab === 'notes' && (
              notes.length === 0 ? (
                <div className="py-8 text-center bg-[#FAFAFA] rounded-2xl border border-dashed border-[#DCE7E3] p-4 text-xs text-[#52656B]">
                  No markers attached yet. Pause video to add one.
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {notes.map((n, idx) => {
                    const isActive = Boolean(activeNoteId && n.id && activeNoteId === n.id);
                    return (
                      <div
                        key={n.id || `note-${idx}`}
                        onClick={() => seekTo(n.timestamp_seconds)}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                          isActive
                            ? 'bg-[#E6F4F1] border-[#087C80] shadow-xs'
                            : 'bg-[#FAFAFA] border-[#DCE7E3] hover:border-[#087C80]/50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="inline-flex items-center space-x-1 font-mono font-bold text-[11px] text-[#07545A] bg-white px-2 py-0.5 rounded border border-[#BCE1D8]">
                            <Clock className="h-3 w-3" />
                            <span>{n.timestamp_display}</span>
                          </span>

                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getTagColor(n.tag)}`}>
                            {n.tag || 'marker'}
                          </span>
                        </div>

                        <p className="text-[#102A35] font-medium leading-relaxed">{n.note}</p>

                        <div className="pt-1 text-[10px] text-[#52656B] flex items-center justify-between">
                          <span>By {n.author_name || 'Tester'}</span>
                          <span className="capitalize">{n.author_role || 'tester'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}

            {/* TAB 2: AI Speech Dialogue & Frustration Stream */}
            {activeSideTab === 'ai_voice' && (
              <div className="space-y-2.5">
                {aiVideo?.executive_voice_summary && (
                  <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 leading-relaxed font-medium">
                    <strong className="block text-[10px] font-extrabold uppercase tracking-wider text-amber-800 mb-0.5">
                      Executive Voice Summary
                    </strong>
                    {aiVideo.executive_voice_summary}
                  </div>
                )}

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {aiVideo?.segments?.map((seg, idx) => {
                    const isHighFrustration = seg.frustration_intensity >= 7;
                    return (
                      <div
                        key={idx}
                        onClick={() => seekTo(seg.timestamp_seconds)}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                          isHighFrustration
                            ? 'bg-rose-50/70 border-rose-200 hover:border-rose-300'
                            : 'bg-[#FAFAFA] border-[#DCE7E3] hover:border-[#087C80]/50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="inline-flex items-center space-x-1 font-mono font-bold text-[11px] text-[#07545A] bg-white px-2 py-0.5 rounded border border-[#BCE1D8]">
                            <Clock className="h-3 w-3" />
                            <span>{seg.timestamp_display}</span>
                          </span>

                          <div className="flex items-center space-x-1">
                            {seg.ui_friction_flag && (
                              <span className="px-1.5 py-0.2 rounded-md bg-white border border-[#DCE7E3] text-[9px] font-bold text-[#52656B]">
                                {seg.ui_friction_flag}
                              </span>
                            )}
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase flex items-center gap-0.5 ${
                                isHighFrustration
                                  ? 'bg-rose-600 text-white'
                                  : seg.frustration_intensity >= 5
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              <Flame className="h-2.5 w-2.5" />
                              <span>{seg.frustration_intensity}/10</span>
                            </span>
                          </div>
                        </div>

                        <p className="text-[#102A35] italic leading-relaxed text-xs">
                          "{seg.spoken_transcript}"
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Add Annotation Form */}
          <div className="bg-[#FAFAFA] p-3.5 rounded-2xl border border-[#DCE7E3] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#102A35]">
                {isFounder ? 'Pin Founder Root-Cause Note' : 'Add Time Annotation'}
              </span>
              <span className="text-[11px] font-mono font-bold text-[#07545A] bg-[#E6F4F1] px-2 py-0.5 rounded border border-[#BCE1D8]">
                At {formatTime(currentTime)}
              </span>
            </div>

            {addSuccessMsg && (
              <div className="p-2 rounded-lg bg-[#E6F7F0] border border-[#B6EDD5] text-[#0E7C57] text-[11px] flex items-center space-x-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>{addSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleAddAnnotation} className="space-y-2">
              <textarea
                rows={2}
                placeholder="Describe bug observation or root-cause at current timestamp..."
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#DCE7E3] rounded-xl text-xs text-[#102A35] focus:outline-none focus:ring-2 focus:ring-[#087C80]/30"
                required
              />

              <div className="flex items-center justify-between gap-2">
                <select
                  value={newNoteTag}
                  onChange={(e) => setNewNoteTag(e.target.value)}
                  className="px-2 py-1.5 bg-white border border-[#DCE7E3] rounded-xl text-xs text-[#102A35]"
                >
                  <option value="root_cause">Root Cause</option>
                  <option value="repro_step">Repro Step</option>
                  <option value="ui_glitch">UI Glitch</option>
                  <option value="crash">Crash / Freeze</option>
                </select>

                <button
                  type="submit"
                  disabled={isAddingNote || !newNoteText.trim()}
                  className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-[#07545A] hover:bg-[#087C80] transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Pin Note</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

