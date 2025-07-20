'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Mic } from 'lucide-react';

export interface WhatsAppAudioPlayerProps {
	src: string;
	avatarSrc?: string;
	timestamp?: string;
	className?: string;
	onPlay?: () => void;
	onPause?: () => void;
	onEnded?: () => void;
	onTimeUpdate?: (currentTime: number, duration: number) => void;
	onError?: (error: Event) => void;
}

interface WaveformBar {
	height: number;
	played: boolean;
}

const WhatsAppAudioPlayer: React.FC<WhatsAppAudioPlayerProps> = ({
	src,
	avatarSrc,
	timestamp = new Date().toLocaleTimeString('en-US', {
		hour12: false,
		hour: '2-digit',
		minute: '2-digit'
	}),
	className = '',
	onPlay,
	onPause,
	onEnded,
	onTimeUpdate,
	onError
}) => {
	const [isPlaying, setIsPlaying] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(0);
	const [playbackSpeed, setPlaybackSpeed] = useState(1);
	const [waveformData, setWaveformData] = useState<WaveformBar[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [canPlay, setCanPlay] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const audioRef = useRef<HTMLAudioElement>(null);
	const waveformRef = useRef<HTMLDivElement>(null);

	// Generate random waveform data (in a real app, this would come from audio analysis)
	const generateWaveformData = useCallback(() => {
		const bars: WaveformBar[] = [];
		const numBars = 40; // Number of waveform bars

		for (let i = 0; i < numBars; i++) {
			bars.push({
				height: Math.random() * 60 + 20, // Random height between 20-80%
				played: false
			});
		}

		setWaveformData(bars);
	}, []);

	const formatTime = (timeInSeconds: number): string => {
		if (!isFinite(timeInSeconds)) return '0:00';

		const minutes = Math.floor(timeInSeconds / 60);
		const seconds = Math.floor(timeInSeconds % 60);
		return `${minutes}:${seconds.toString().padStart(2, '0')}`;
	};

	const updateWaveform = useCallback(() => {
		if (duration === 0) return;

		const progress = currentTime / duration;
		setWaveformData((prev) =>
			prev.map((bar, index) => ({
				...bar,
				played: index / prev.length <= progress
			}))
		);
	}, [currentTime, duration]);

	const handlePlayPause = async () => {
		if (!audioRef.current) return;

		try {
			const audio = audioRef.current;

			// Check if audio has error and reload if necessary
			if (audio.error) {
				audio.load();
			}

			// Check ready state before attempting to play
			if (!isPlaying) {
				if (audio.readyState < audio.HAVE_FUTURE_DATA && !canPlay) {
					setError('Audio is not ready to play yet');
					return;
				}

				const playPromise = audio.play();
				if (playPromise) {
					await playPromise;
				}
				setIsPlaying(true);
				onPlay?.();
			} else {
				audio.pause();
				setIsPlaying(false);
				onPause?.();
			}
		} catch (error) {
			console.error('Error playing audio:', error);
			setError('Failed to play audio');
			setIsPlaying(false);
		}
	};

	const handleSpeedChange = () => {
		const speeds = [1, 1.5, 2];
		const currentIndex = speeds.indexOf(playbackSpeed);
		const nextSpeed = speeds[(currentIndex + 1) % speeds.length];

		setPlaybackSpeed(nextSpeed);
		if (audioRef.current) {
			audioRef.current.playbackRate = nextSpeed;
		}
	};

	const handleWaveformClick = (event: React.MouseEvent<HTMLDivElement>) => {
		if (!waveformRef.current || !audioRef.current || duration === 0) return;

		const rect = waveformRef.current.getBoundingClientRect();
		const clickX = event.clientX - rect.left;
		const clickRatio = clickX / rect.width;
		const newTime = clickRatio * duration;

		audioRef.current.currentTime = newTime;
		setCurrentTime(newTime);
	};

	// Audio event handlers
	useEffect(() => {
		const audio = audioRef.current;
		if (!audio) return;

		const handleLoadStart = () => {
			setIsLoading(true);
			setCanPlay(false);
			setError(null);
		};

		const handleLoadedMetadata = () => {
			setDuration(audio.duration);
			generateWaveformData();
		};

		const handleCanPlay = () => {
			setCanPlay(true);
			setIsLoading(false);
			setError(null);
		};

		const handleCanPlayThrough = () => {
			setCanPlay(true);
			setIsLoading(false);
		};

		const handleTimeUpdate = () => {
			setCurrentTime(audio.currentTime);
			onTimeUpdate?.(audio.currentTime, audio.duration);
		};

		const handlePlay = () => {
			setIsPlaying(true);
		};

		const handlePause = () => {
			setIsPlaying(false);
		};

		const handleEnded = () => {
			setIsPlaying(false);
			setCurrentTime(0);
			onEnded?.();
		};

		const handleError = (e: Event) => {
			const target = e.target as HTMLAudioElement;
			// Handle the case where currentTime equals duration even with error
			if (target.error && target.currentTime === target.duration) {
				return handleEnded();
			}
			setIsLoading(false);
			setCanPlay(false);
			setError('Failed to load audio');
			console.error('Audio error:', target.error);
			onError?.(e);
		};

		const handleWaiting = () => {
			setIsLoading(true);
		};

		const handlePlaying = () => {
			setIsLoading(false);
		};

		// Add all event listeners
		audio.addEventListener('loadstart', handleLoadStart);
		audio.addEventListener('loadedmetadata', handleLoadedMetadata);
		audio.addEventListener('canplay', handleCanPlay);
		audio.addEventListener('canplaythrough', handleCanPlayThrough);
		audio.addEventListener('timeupdate', handleTimeUpdate);
		audio.addEventListener('play', handlePlay);
		audio.addEventListener('pause', handlePause);
		audio.addEventListener('ended', handleEnded);
		audio.addEventListener('error', handleError);
		audio.addEventListener('waiting', handleWaiting);
		audio.addEventListener('playing', handlePlaying);

		// Set initial playback rate
		audio.playbackRate = playbackSpeed;

		return () => {
			audio.removeEventListener('loadstart', handleLoadStart);
			audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
			audio.removeEventListener('canplay', handleCanPlay);
			audio.removeEventListener('canplaythrough', handleCanPlayThrough);
			audio.removeEventListener('timeupdate', handleTimeUpdate);
			audio.removeEventListener('play', handlePlay);
			audio.removeEventListener('pause', handlePause);
			audio.removeEventListener('ended', handleEnded);
			audio.removeEventListener('error', handleError);
			audio.removeEventListener('waiting', handleWaiting);
			audio.removeEventListener('playing', handlePlaying);
		};
	}, [
		src,
		playbackSpeed,
		generateWaveformData,
		onTimeUpdate,
		onEnded,
		onError
	]);

	// Update waveform when currentTime changes
	useEffect(() => {
		updateWaveform();
	}, [updateWaveform]);

	return (
		<div
			className={`relative flex max-w-sm items-center gap-3 rounded-lg bg-[#075E54] p-3 ${className} `}
		>
			{/* Hidden audio element */}
			<audio ref={audioRef} src={src} preload="auto" crossOrigin="anonymous" />

			{/* Error State */}
			{error && (
				<div className="absolute inset-0 flex items-center justify-center rounded-lg bg-red-500 bg-opacity-90">
					<span className="text-sm font-medium text-white">{error}</span>
				</div>
			)}

			{/* Avatar with microphone icon */}
			<div className="relative flex-shrink-0">
				<div className="h-10 w-10 overflow-hidden rounded-full bg-gray-300">
					{avatarSrc ? (
						<img
							src={avatarSrc}
							alt="Avatar"
							className="h-full w-full object-cover"
						/>
					) : (
						<div className="flex h-full w-full items-center justify-center bg-gray-400">
							<span className="text-sm font-semibold text-white">
								{/* Default avatar placeholder */}
								👤
							</span>
						</div>
					)}
				</div>
				{/* Microphone overlay */}
				<div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-green-500">
					<Mic className="h-3 w-3 text-white" />
				</div>
			</div>

			{/* Audio controls and waveform */}
			<div className="flex flex-1 items-center gap-2">
				{/* Play/Pause Button */}
				<button
					onClick={handlePlayPause}
					disabled={isLoading && !canPlay}
					className="text-white transition-colors hover:text-gray-200 disabled:opacity-50"
					aria-label={isPlaying ? 'Pause' : 'Play'}
				>
					{(isLoading && !canPlay) || (isLoading && isPlaying) ? (
						<div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
					) : isPlaying ? (
						<Pause className="h-6 w-6 fill-current" />
					) : (
						<Play className="h-6 w-6 fill-current" />
					)}
				</button>

				{/* Playback Speed (shows only when playing) */}
				{isPlaying && (
					<button
						onClick={handleSpeedChange}
						className="rounded-full bg-gray-700 px-2 py-1 text-xs text-white transition-colors hover:bg-gray-600"
					>
						{playbackSpeed}x
					</button>
				)}

				{/* Waveform */}
				<div
					ref={waveformRef}
					className="flex h-8 flex-1 cursor-pointer items-center gap-[2px]"
					onClick={handleWaveformClick}
				>
					{waveformData.map((bar, index) => (
						<div
							key={index}
							className={`w-[2px] transition-colors duration-150 ${bar.played ? 'bg-blue-400' : 'bg-green-300'} `}
							style={{ height: `${bar.height}%` }}
						/>
					))}

					{/* Progress indicator dot */}
					{duration > 0 && (
						<div
							className="absolute h-2 w-2 -translate-x-1 transform rounded-full bg-blue-400"
							style={{
								left: `${(currentTime / duration) * 100}%`,
								top: '50%',
								transform: 'translateY(-50%)'
							}}
						/>
					)}
				</div>
			</div>

			{/* Duration and timestamp */}
			<div className="flex flex-col items-end gap-1 text-xs text-gray-300">
				<span className="text-white">
					{duration > 0 ? formatTime(duration - currentTime) : '0:00'}
				</span>
				<span>{timestamp}</span>
			</div>
		</div>
	);
};

export default WhatsAppAudioPlayer;
