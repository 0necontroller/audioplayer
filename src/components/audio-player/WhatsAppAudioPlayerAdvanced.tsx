'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Mic } from 'lucide-react';
import { useAudioPlayer } from './useAudioPlayer';

interface WhatsAppAudioPlayerAdvancedProps {
	src: string;
	avatarSrc?: string;
	timestamp?: string;
	className?: string;
	autoPlay?: boolean;
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

const WhatsAppAudioPlayerAdvanced: React.FC<
	WhatsAppAudioPlayerAdvancedProps
> = ({
	src,
	avatarSrc,
	timestamp = new Date().toLocaleTimeString('en-US', {
		hour12: false,
		hour: '2-digit',
		minute: '2-digit'
	}),
	className = '',
	autoPlay = false,
	onPlay,
	onPause,
	onEnded,
	onTimeUpdate,
	onError
}) => {
	const [playbackSpeed, setPlaybackSpeed] = useState(1);
	const [waveformData, setWaveformData] = useState<WaveformBar[]>([]);

	const waveformRef = useRef<HTMLDivElement>(null);

	const { audioRef, state, controls } = useAudioPlayer({
		src,
		autoPlay,
		playbackRate: playbackSpeed,
		onPlay,
		onPause,
		onEnded,
		onTimeUpdate,
		onError,
		onLoadedMetadata: () => {
			generateWaveformData();
		}
	});

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
		if (state.duration === 0) return;

		const progress = state.currentTime / state.duration;
		setWaveformData((prev) =>
			prev.map((bar, index) => ({
				...bar,
				played: index / prev.length <= progress
			}))
		);
	}, [state.currentTime, state.duration]);

	const handlePlayPause = async () => {
		await controls.toggle();
	};

	const handleSpeedChange = () => {
		const speeds = [1, 1.5, 2];
		const currentIndex = speeds.indexOf(playbackSpeed);
		const nextSpeed = speeds[(currentIndex + 1) % speeds.length];

		setPlaybackSpeed(nextSpeed);
		controls.setPlaybackRate(nextSpeed);
	};

	const handleWaveformClick = (event: React.MouseEvent<HTMLDivElement>) => {
		if (!waveformRef.current || state.duration === 0) return;

		const rect = waveformRef.current.getBoundingClientRect();
		const clickX = event.clientX - rect.left;
		const clickRatio = clickX / rect.width;
		const newTime = clickRatio * state.duration;

		controls.seek(newTime);
	};

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
			{state.error && (
				<div className="absolute inset-0 flex items-center justify-center rounded-lg bg-red-500 bg-opacity-90">
					<span className="text-sm font-medium text-white">{state.error}</span>
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
					disabled={state.isLoading && !state.canPlay}
					className="text-white transition-colors hover:text-gray-200 disabled:opacity-50"
					aria-label={state.isPlaying ? 'Pause' : 'Play'}
				>
					{(state.isLoading && !state.canPlay) ||
					(state.isLoading && state.isPlaying) ? (
						<div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
					) : state.isPlaying ? (
						<Pause className="h-6 w-6 fill-current" />
					) : (
						<Play className="h-6 w-6 fill-current" />
					)}
				</button>

				{/* Playback Speed (shows only when playing) */}
				{state.isPlaying && (
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
					className="relative flex h-8 flex-1 cursor-pointer items-center gap-[2px]"
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
					{state.duration > 0 && (
						<div
							className="absolute h-2 w-2 -translate-x-1 transform rounded-full bg-blue-400"
							style={{
								left: `${(state.currentTime / state.duration) * 100}%`,
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
					{state.duration > 0
						? formatTime(state.duration - state.currentTime)
						: '0:00'}
				</span>
				<span>{timestamp}</span>
			</div>

			{/* Error state */}
			{state.error && (
				<div className="absolute inset-0 flex items-center justify-center rounded-lg bg-red-500 bg-opacity-80">
					<span className="text-sm text-white">Error loading audio</span>
				</div>
			)}
		</div>
	);
};

export default WhatsAppAudioPlayerAdvanced;
