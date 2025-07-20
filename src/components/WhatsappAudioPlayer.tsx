'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';

interface WhatsappAudioPlayerProps {
	src: string;
	duration?: string;
	isReceived?: boolean; // true for received messages, false for sent
}

const WhatsappAudioPlayer: React.FC<WhatsappAudioPlayerProps> = ({
	src,
	duration = '0:00',
	isReceived = true
}) => {
	const [isPlaying, setIsPlaying] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	const [totalDuration, setTotalDuration] = useState(0);
	const [playbackSpeed, setPlaybackSpeed] = useState(1);
	const audioRef = useRef<HTMLAudioElement>(null);
	const waveformRef = useRef<HTMLDivElement>(null);

	// Generate waveform bars (static for now, could be dynamic with actual audio analysis)
	const generateWaveformBars = () => {
		const bars = [];
		const barCount = 40;

		for (let i = 0; i < barCount; i++) {
			// Create more realistic waveform pattern
			const normalizedIndex = i / barCount;
			const wave1 = Math.sin(normalizedIndex * Math.PI * 6) * 0.3;
			const wave2 = Math.sin(normalizedIndex * Math.PI * 12) * 0.2;
			const randomness = (Math.random() - 0.5) * 0.3;
			const height = Math.max(
				4,
				Math.min(24, 12 + (wave1 + wave2 + randomness) * 8)
			);

			const progress = totalDuration > 0 ? currentTime / totalDuration : 0;
			const isPlayed = i / barCount < progress;

			bars.push(
				<div
					key={i}
					className={`w-0.5 rounded-full transition-colors duration-200 ${
						isPlayed ? 'bg-blue-400' : 'bg-green-300 opacity-70'
					}`}
					style={{ height: `${height}px` }}
				/>
			);
		}

		return bars;
	};

	const togglePlayback = () => {
		if (audioRef.current) {
			if (isPlaying) {
				audioRef.current.pause();
			} else {
				audioRef.current.play();
			}
			setIsPlaying(!isPlaying);
		}
	};

	const toggleSpeed = () => {
		const speeds = [1, 1.5, 2];
		const currentIndex = speeds.indexOf(playbackSpeed);
		const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
		setPlaybackSpeed(nextSpeed);

		if (audioRef.current) {
			audioRef.current.playbackRate = nextSpeed;
		}
	};

	const formatTime = (time: number) => {
		const minutes = Math.floor(time / 60);
		const seconds = Math.floor(time % 60);
		return `${minutes}:${seconds.toString().padStart(2, '0')}`;
	};

	useEffect(() => {
		const audio = audioRef.current;

		if (audio) {
			const updateTime = () => setCurrentTime(audio.currentTime);
			const updateDuration = () => setTotalDuration(audio.duration);
			const handleEnded = () => setIsPlaying(false);

			audio.addEventListener('timeupdate', updateTime);
			audio.addEventListener('loadedmetadata', updateDuration);
			audio.addEventListener('ended', handleEnded);

			return () => {
				audio.removeEventListener('timeupdate', updateTime);
				audio.removeEventListener('loadedmetadata', updateDuration);
				audio.removeEventListener('ended', handleEnded);
			};
		}
	}, []);

	const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
		if (!waveformRef.current || !audioRef.current || !totalDuration) return;

		const rect = waveformRef.current.getBoundingClientRect();
		const clickX = e.clientX - rect.left;
		const progress = Math.max(0, Math.min(1, clickX / rect.width));

		const newTime = progress * totalDuration;
		audioRef.current.currentTime = newTime;
		setCurrentTime(newTime);
	};

	return (
		<div
			className={`relative flex max-w-lg items-center rounded-lg p-3 ${
				isReceived
					? 'mr-auto ml-0 bg-green-800 text-white'
					: 'mr-0 ml-auto bg-gray-700 text-white'
			} shadow-md`}
		>
			{/* Hidden audio element */}
			<audio ref={audioRef} src={src} />

			{/* Profile Picture / Avatar */}
			<div className="relative mr-3 flex-shrink-0">
				<div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gray-500">
					<Icon icon="mdi:account" className="text-lg text-white" />
				</div>
				<div className="absolute -right-1 -bottom-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-green-500">
					<Icon icon="mdi:microphone" className="text-xs text-white" />
				</div>
			</div>

			{/* Audio Controls Container */}
			<div className="flex min-w-0 flex-1 items-center">
				{/* Playback Speed Indicator (only show when not 1x) */}
				{playbackSpeed !== 1 && (
					<button
						onClick={toggleSpeed}
						className="bg-opacity-30 hover:bg-opacity-40 mr-2 rounded-full bg-black px-2 py-1 text-xs font-medium text-white transition-all duration-200"
					>
						{playbackSpeed}x
					</button>
				)}

				{/* Play/Pause Button */}
				<button
					onClick={togglePlayback}
					className="mr-3 flex-shrink-0 p-1 text-white transition-colors hover:text-gray-300"
					aria-label={isPlaying ? 'Pause' : 'Play'}
				>
					{isPlaying ? (
						<div className="flex h-7 w-7 items-center justify-center">
							<div className="mr-0.5 h-4 w-2 rounded-sm bg-current"></div>
							<div className="h-4 w-2 rounded-sm bg-current"></div>
						</div>
					) : (
						<div className="flex h-7 w-7 items-center justify-center">
							<div className="ml-1 h-0 w-0 border-t-[7px] border-b-[7px] border-l-[10px] border-t-transparent border-b-transparent border-l-current"></div>
						</div>
					)}
				</button>

				{/* Waveform Visualization Container */}
				<div className="relative mr-3 flex-1">
					<div
						ref={waveformRef}
						className="relative flex h-8 cursor-pointer items-center justify-center space-x-1 py-2"
						onClick={handleWaveformClick}
					>
						{generateWaveformBars()}

						{/* Progress indicator dot */}
						{totalDuration > 0 && (
							<div
								className="absolute z-10 h-2 w-2 -translate-x-1/2 transform rounded-full bg-blue-400 shadow-sm transition-all duration-100"
								style={{
									left: `${(currentTime / totalDuration) * 100}%`,
									top: '50%',
									transform: 'translate(-50%, -50%)'
								}}
							/>
						)}
					</div>
				</div>

				{/* Duration */}
				<div className="flex-shrink-0 font-mono text-xs text-gray-300">
					{totalDuration > 0 ? formatTime(totalDuration) : duration}
				</div>
			</div>

			{/* Speed Control Button (always visible but subtle) */}
			<button
				onClick={toggleSpeed}
				className="ml-2 rounded px-1 py-0.5 text-xs text-gray-400 transition-colors hover:text-white"
				title="Playback speed"
			>
				{playbackSpeed}×
			</button>
		</div>
	);
};

export default WhatsappAudioPlayer;
