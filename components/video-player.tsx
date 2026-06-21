"use client";

import { useRef, useState, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, PlayCircle } from "lucide-react";

interface VideoPlayerProps {
  url: string;
  lessonId: string;
  initialWatchedSeconds?: number;
  onComplete?: () => void;
}

export default function VideoPlayer({
  url,
  lessonId,
  initialWatchedSeconds = 0,
  onComplete,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isCompletedSynced, setIsCompletedSynced] = useState(false);
  const lastSyncTimeRef = useRef<number>(0);

  // Sync progress back to API
  const syncProgress = async (completed: boolean, time: number) => {
    try {
      await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId,
          completed,
          watchedSeconds: Math.round(time),
        }),
      });

      if (completed) {
        setIsCompletedSynced(true);
        if (onComplete) onComplete();
      }
    } catch (err) {
      console.error("[VIDEO_PROGRESS_SYNC_FAILED]", err);
    }
  };

  // Initialize and Seek to last position on video loaded metadata
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setIsCompletedSynced(false);

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      if (initialWatchedSeconds > 0 && initialWatchedSeconds < video.duration - 5) {
        video.currentTime = initialWatchedSeconds;
      }
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, [url, initialWatchedSeconds]);

  // Listen to time updates and auto-sync
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const current = video.currentTime;
      setCurrentTime(current);

      // Periodic progress save: every 10 seconds of playback
      if (Math.abs(current - lastSyncTimeRef.current) >= 10) {
        lastSyncTimeRef.current = current;
        syncProgress(false, current);
      }

      // Check if watched 90% or more to mark as complete
      if (video.duration > 0 && !isCompletedSynced) {
        const percent = (current / video.duration) * 100;
        if (percent >= 90) {
          setIsCompletedSynced(true);
          syncProgress(true, current);
        }
      }
    };

    const handlePause = () => {
      setIsPlaying(false);
      syncProgress(false, video.currentTime);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      syncProgress(true, video.currentTime);
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("pause", handlePause);
    video.addEventListener("play", handlePlay);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("ended", handleEnded);
    };
  }, [lessonId, isCompletedSynced, duration]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  };

  const handleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.requestFullscreen) {
      video.requestFullscreen();
    }
  };

  return (
    <div className="relative group overflow-hidden rounded-2xl bg-black aspect-video w-full shadow-lg border border-slate-800">
      <video
        ref={videoRef}
        src={url}
        className="h-full w-full object-contain cursor-pointer"
        onClick={togglePlay}
        controls
      />
      
      {/* Custom playoverlay when paused on initial load */}
      {!isPlaying && currentTime === 0 && (
        <div
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/45 cursor-pointer transition hover:bg-black/35"
        >
          <PlayCircle className="h-16 w-16 text-blue-500 fill-white drop-shadow-md hover:scale-105 transition" />
        </div>
      )}
    </div>
  );
}
