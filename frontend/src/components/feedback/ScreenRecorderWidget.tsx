/**
 * TryLo Live In-Browser Screen & Audio Recording Widget
 * Native MediaDevices API + MediaRecorder: Zero third-party plugins required.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Video,
  Mic,
  MicOff,
  Square,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Plus,
  Trash2,
  UploadCloud,
  Loader2,
  Film,
} from 'lucide-react';
import { uploadFeedbackVideo, type TimestampedNote } from '../../api/feedback';

interface ScreenRecorderWidgetProps {
  onRecordingComplete: (data: {
    video_url: string;
    video_duration_seconds: number;
    video_format: string;
    timestamped_notes: TimestampedNote[];
  }) => void;
  initialVideoUrl?: string | null;
  onClear?: () => void;
}

export const ScreenRecorderWidget: React.FC<ScreenRecorderWidgetProps> = ({
  onRecordingComplete,
  initialVideoUrl = null,
  onClear,
}) => {
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'paused' | 'stopped'>('idle');
  const [includeMic, setIncludeMic] = useState<boolean>(true);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialVideoUrl);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(initialVideoUrl);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Timestamped Notes added during preview review
  const [timestampedNotes, setTimestampedNotes] = useState<TimestampedNote[]>([]);
  const [newNoteText, setNewNoteText] = useState<string>('');
  const [newNoteTag, setNewNoteTag] = useState<string>('repro_step');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);

  // Timer effect for live recording elapsed time
  useEffect(() => {
    if (recordingState === 'recording') {
      timerRef.current = window.setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [recordingState]);

  const formatTime = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const startRecording = async () => {
    setErrorMessage(null);
    setElapsedSeconds(0);
    chunksRef.current = [];

    try {
      // 1. Capture screen stream
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'browser',
        },
        audio: true, // System audio if user permits
      });

      let finalStream = displayStream;

      // 2. Mix microphone audio if enabled
      if (includeMic) {
        try {
          const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const audioContext = new AudioContext();
          const destination = audioContext.createMediaStreamDestination();

          if (displayStream.getAudioTracks().length > 0) {
            const displaySource = audioContext.createMediaStreamSource(displayStream);
            displaySource.connect(destination);
          }

          const micSource = audioContext.createMediaStreamSource(micStream);
          micSource.connect(destination);

          finalStream = new MediaStream([
            ...displayStream.getVideoTracks(),
            ...destination.stream.getAudioTracks(),
          ]);
        } catch {
          // Microphone access denied or unavailable, proceed with screen only
        }
      }

      streamRef.current = displayStream;

      // Handle user stopping screen share from browser banner
      displayStream.getVideoTracks()[0].onended = () => {
        stopRecording();
      };

      // 3. Setup MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : MediaRecorder.isTypeSupported('video/webm')
        ? 'video/webm'
        : 'video/mp4';

      const recorder = new MediaRecorder(finalStream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const fullBlob = new Blob(chunksRef.current, { type: mimeType });
        setRecordedBlob(fullBlob);
        const url = URL.createObjectURL(fullBlob);
        setPreviewUrl(url);
        setRecordingState('stopped');

        // Stop all media tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
        }
      };

      recorder.start(1000); // 1-second chunks
      setRecordingState('recording');
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Could not start screen recording. Please grant screen recording permissions.'
      );
      setRecordingState('idle');
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.pause();
      setRecordingState('paused');
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'paused') {
      mediaRecorderRef.current.resume();
      setRecordingState('recording');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const resetRecording = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    setRecordingState('idle');
    setRecordedBlob(null);
    setPreviewUrl(null);
    setUploadedUrl(null);
    setElapsedSeconds(0);
    setTimestampedNotes([]);
    setErrorMessage(null);
    if (onClear) onClear();
  };

  const handleUploadAndSave = async () => {
    if (!recordedBlob) return;
    setIsUploading(true);
    setErrorMessage(null);

    try {
      const res = await uploadFeedbackVideo(recordedBlob);
      setUploadedUrl(res.video_url);

      onRecordingComplete({
        video_url: res.video_url,
        video_duration_seconds: elapsedSeconds || 1,
        video_format: res.format,
        timestamped_notes: timestampedNotes,
      });
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to upload screen recording.');
    } finally {
      setIsUploading(false);
    }
  };

  // Add a timestamped note at current preview playback second
  const handleAddTimestampNote = () => {
    if (!newNoteText.trim()) return;
    const currentTime = previewVideoRef.current ? Math.floor(previewVideoRef.current.currentTime) : 0;
    const noteObj: TimestampedNote = {
      id: Math.random().toString(36).slice(2, 9),
      timestamp_seconds: currentTime,
      timestamp_display: formatTime(currentTime),
      note: newNoteText.trim(),
      tag: newNoteTag,
    };

    const updated = [...timestampedNotes, noteObj].sort((a, b) => a.timestamp_seconds - b.timestamp_seconds);
    setTimestampedNotes(updated);
    setNewNoteText('');

    // If already uploaded, inform parent of updated notes
    if (uploadedUrl) {
      onRecordingComplete({
        video_url: uploadedUrl,
        video_duration_seconds: elapsedSeconds || 1,
        video_format: 'webm',
        timestamped_notes: updated,
      });
    }
  };

  const removeTimestampNote = (id: string) => {
    const updated = timestampedNotes.filter((n) => n.id !== id);
    setTimestampedNotes(updated);
    if (uploadedUrl) {
      onRecordingComplete({
        video_url: uploadedUrl,
        video_duration_seconds: elapsedSeconds || 1,
        video_format: 'webm',
        timestamped_notes: updated,
      });
    }
  };

  return (
    <div className="rounded-2xl border border-[#DCE7E3] bg-[#FAFAFA] p-4 sm:p-5 space-y-4 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#DCE7E3]">
        <div className="flex items-center space-x-2.5">
          <div className="h-8 w-8 rounded-xl bg-[#E6F4F1] border border-[#BCE1D8] flex items-center justify-center text-[#07545A]">
            <Film className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-[#102A35]">
              In-Browser Bug Video Reproduction
            </h4>
            <p className="text-[11px] text-[#52656B]">
              Record your screen and microphone directly in TryLo without third-party tools.
            </p>
          </div>
        </div>

        {/* Audio mic toggle */}
        {recordingState === 'idle' && (
          <button
            type="button"
            onClick={() => setIncludeMic(!includeMic)}
            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-colors cursor-pointer ${
              includeMic
                ? 'bg-[#E6F4F1] text-[#07545A] border-[#BCE1D8]'
                : 'bg-white text-[#52656B] border-[#DCE7E3]'
            }`}
          >
            {includeMic ? <Mic className="h-3.5 w-3.5 text-[#087C80]" /> : <MicOff className="h-3.5 w-3.5" />}
            <span>{includeMic ? 'Mic Audio Active' : 'Muted'}</span>
          </button>
        )}
      </div>

      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* STATE 1: IDLE */}
      {recordingState === 'idle' && !previewUrl && (
        <div className="text-center py-6 px-4 bg-white rounded-xl border border-dashed border-[#DCE7E3] space-y-3">
          <div className="mx-auto h-12 w-12 rounded-full bg-[#E6F4F1] flex items-center justify-center text-[#07545A]">
            <Video className="h-6 w-6" />
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-[#102A35]">Record Live Screen &amp; Audio Proof</p>
            <p className="text-[11px] text-[#52656B] max-w-sm mx-auto">
              Click Start Recording to select your app window or browser tab. You can narrate reproduction steps.
            </p>
          </div>
          <button
            type="button"
            onClick={startRecording}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-full text-xs font-bold text-white bg-[#07545A] hover:bg-[#087C80] transition-colors shadow-xs cursor-pointer"
          >
            <Video className="h-4 w-4" />
            <span>Start Screen Recording</span>
          </button>
        </div>
      )}

      {/* STATE 2: RECORDING OR PAUSED */}
      {(recordingState === 'recording' || recordingState === 'paused') && (
        <div className="p-5 bg-white rounded-xl border border-[#DCE7E3] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <span className="relative flex h-3 w-3">
                {recordingState === 'recording' && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                )}
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600" />
              </span>
              <span className="text-xs font-bold text-[#102A35]">
                {recordingState === 'recording' ? 'Recording in progress...' : 'Recording paused'}
              </span>
            </div>

            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#F6F5ED] text-xs font-mono font-bold text-[#102A35] border border-[#DCE7E3]">
              <Clock className="h-3.5 w-3.5 text-[#087C80]" />
              <span>{formatTime(elapsedSeconds)}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {recordingState === 'recording' ? (
              <button
                type="button"
                onClick={pauseRecording}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-white border border-[#DCE7E3] text-[#102A35] hover:bg-[#F6F5ED] transition-colors cursor-pointer"
              >
                <Pause className="h-3.5 w-3.5 text-amber-600" />
                <span>Pause</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={resumeRecording}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-white border border-[#DCE7E3] text-[#102A35] hover:bg-[#F6F5ED] transition-colors cursor-pointer"
              >
                <Play className="h-3.5 w-3.5 text-teal-700" />
                <span>Resume</span>
              </button>
            )}

            <button
              type="button"
              onClick={stopRecording}
              className="inline-flex items-center space-x-1.5 px-5 py-2 rounded-full text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors cursor-pointer"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
              <span>Finish Recording</span>
            </button>
          </div>
        </div>
      )}

      {/* STATE 3: PREVIEW & ANNOTATIONS (STOPPED) */}
      {previewUrl && recordingState === 'stopped' && (
        <div className="space-y-4">
          <div className="rounded-xl overflow-hidden bg-black border border-[#DCE7E3] relative aspect-video flex items-center justify-center">
            <video
              ref={previewVideoRef}
              src={previewUrl}
              controls
              className="w-full h-full max-h-72 object-contain"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center space-x-2 text-[#52656B]">
              <Clock className="h-3.5 w-3.5 text-[#087C80]" />
              <span>Total Duration: {formatTime(elapsedSeconds || 1)}</span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={resetRecording}
                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-full bg-white border border-[#DCE7E3] text-[#52656B] hover:text-[#102A35] transition-colors cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Discard &amp; Re-record</span>
              </button>

              {!uploadedUrl ? (
                <button
                  type="button"
                  onClick={handleUploadAndSave}
                  disabled={isUploading}
                  className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-full font-bold bg-[#07545A] hover:bg-[#087C80] text-white transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UploadCloud className="h-3.5 w-3.5" />}
                  <span>{isUploading ? 'Uploading Video...' : 'Attach Video to Report'}</span>
                </button>
              ) : (
                <span className="inline-flex items-center space-x-1 text-xs font-bold text-[#0E7C57] bg-[#E6F7F0] px-3 py-1.5 rounded-full border border-[#B6EDD5]">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Video Attached</span>
                </span>
              )}
            </div>
          </div>

          {/* Timestamped Bug Annotation Creator */}
          <div className="p-3.5 bg-white rounded-xl border border-[#DCE7E3] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#102A35]">Add Timestamped Repro Markers</span>
              <span className="text-[10px] text-[#52656B]">Pause video at key second &bull; click Add</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2">
              <input
                type="text"
                placeholder="e.g. [0:14] Button freezes tab after clicking checkout"
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                className="flex-1 w-full px-3 py-1.5 bg-[#FAFAFA] border border-[#DCE7E3] rounded-lg text-xs text-[#102A35] focus:outline-none focus:ring-1 focus:ring-[#087C80]"
              />

              <select
                value={newNoteTag}
                onChange={(e) => setNewNoteTag(e.target.value)}
                className="px-2.5 py-1.5 bg-[#FAFAFA] border border-[#DCE7E3] rounded-lg text-xs text-[#102A35]"
              >
                <option value="repro_step">Repro Step</option>
                <option value="ui_glitch">UI Glitch</option>
                <option value="console_error">Console Error</option>
                <option value="crash">Crash / Freeze</option>
              </select>

              <button
                type="button"
                onClick={handleAddTimestampNote}
                disabled={!newNoteText.trim()}
                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#087C80] hover:bg-[#07545A] text-white disabled:opacity-50 transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Mark Second</span>
              </button>
            </div>

            {/* List of Added Notes */}
            {timestampedNotes.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {timestampedNotes.map((note) => (
                  <div
                    key={note.id}
                    className="p-2 rounded-lg bg-[#F6F5ED] border border-[#DCE7E3] flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-[#07545A] bg-[#E6F4F1] px-1.5 py-0.5 rounded border border-[#BCE1D8]">
                        {note.timestamp_display}
                      </span>
                      <span className="text-[#102A35]">{note.note}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeTimestampNote(note.id!)}
                      className="p-1 text-[#52656B] hover:text-rose-600 transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

