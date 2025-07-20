'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

export interface UseAudioPlayerOptions {
	src: string;
	autoPlay?: boolean;
	loop?: boolean;
	volume?: number;
	playbackRate?: number;
	onPlay?: () => void;
	onPause?: () => void;
	onEnded?: () => void;
	onError?: (error: Event) => void;
	onTimeUpdate?: (currentTime: number, duration: number) => void;
	onLoadedMetadata?: () => void;
}

export interface AudioPlayerState {
	isPlaying: boolean;
	currentTime: number;
	duration: number;
	buffered: number;
	volume: number;
	playbackRate: number;
	isLoading: boolean;
	canPlay: boolean;
	error: string | null;
}

export interface AudioPlayerControls {
	play: () => Promise<void>;
	pause: () => void;
	seek: (time: number) => void;
	setVolume: (volume: number) => void;
	setPlaybackRate: (rate: number) => void;
	toggle: () => Promise<void>;
	reset: () => void;
}

export const useAudioPlayer = (options: UseAudioPlayerOptions) => {
	const {
		src,
		autoPlay = false,
		loop = false,
		volume = 1,
		playbackRate = 1,
		onPlay,
		onPause,
		onEnded,
		onError,
		onTimeUpdate,
		onLoadedMetadata
	} = options;

	const audioRef = useRef<HTMLAudioElement>(null);

	const [state, setState] = useState<AudioPlayerState>({
		isPlaying: false,
		currentTime: 0,
		duration: 0,
		buffered: 0,
		volume,
		playbackRate,
		isLoading: true,
		canPlay: false,
		error: null
	});

	// Audio event handlers
	const handleLoadStart = useCallback(() => {
		setState((prev) => ({
			...prev,
			isLoading: true,
			canPlay: false,
			error: null
		}));
	}, []);

	const handleLoadedMetadata = useCallback(() => {
		if (!audioRef.current) return;

		setState((prev) => ({
			...prev,
			duration: audioRef.current!.duration,
			error: null
		}));

		onLoadedMetadata?.();
	}, [onLoadedMetadata]);

	const handleCanPlay = useCallback(() => {
		setState((prev) => ({
			...prev,
			isLoading: false,
			canPlay: true,
			error: null
		}));
	}, []);

	const handleCanPlayThrough = useCallback(() => {
		setState((prev) => ({
			...prev,
			isLoading: false,
			canPlay: true,
			error: null
		}));
	}, []);

	const handleTimeUpdate = useCallback(() => {
		if (!audioRef.current) return;

		const currentTime = audioRef.current.currentTime;
		const duration = audioRef.current.duration;

		setState((prev) => ({
			...prev,
			currentTime
		}));

		onTimeUpdate?.(currentTime, duration);
	}, [onTimeUpdate]);

	const handleProgress = useCallback(() => {
		if (!audioRef.current || !audioRef.current.buffered.length) return;

		const buffered = audioRef.current.buffered.end(
			audioRef.current.buffered.length - 1
		);
		setState((prev) => ({ ...prev, buffered }));
	}, []);

	const handlePlay = useCallback(() => {
		setState((prev) => ({ ...prev, isPlaying: true }));
		onPlay?.();
	}, [onPlay]);

	const handlePause = useCallback(() => {
		setState((prev) => ({ ...prev, isPlaying: false }));
		onPause?.();
	}, [onPause]);

	const handleEnded = useCallback(() => {
		setState((prev) => ({
			...prev,
			isPlaying: false,
			currentTime: 0
		}));
		onEnded?.();
	}, [onEnded]);

	const handleError = useCallback(
		(event: Event) => {
			const target = event.target as HTMLAudioElement;
			// Handle case where currentTime equals duration even with error
			if (target.error && target.currentTime === target.duration) {
				return handleEnded();
			}
			setState((prev) => ({
				...prev,
				isLoading: false,
				canPlay: false,
				error: 'Failed to load audio'
			}));
			onError?.(event);
		},
		[onError, handleEnded]
	);

	const handleWaiting = useCallback(() => {
		setState((prev) => ({ ...prev, isLoading: true }));
	}, []);

	const handlePlaying = useCallback(() => {
		setState((prev) => ({ ...prev, isLoading: false }));
	}, []);

	// Controls
	const play = useCallback(async () => {
		if (!audioRef.current) return;

		try {
			const audio = audioRef.current;

			// Check if audio has error and reload if necessary
			if (audio.error) {
				audio.load();
			}

			// Check ready state before attempting to play
			if (audio.readyState < audio.HAVE_FUTURE_DATA && !state.canPlay) {
				throw new Error('Audio is not ready to play yet');
			}

			await audio.play();
		} catch (error) {
			console.error('Error playing audio:', error);
			setState((prev) => ({
				...prev,
				error: 'Failed to play audio',
				isLoading: false,
				canPlay: false
			}));
		}
	}, [state.canPlay]);

	const pause = useCallback(() => {
		if (!audioRef.current) return;
		audioRef.current.pause();
	}, []);

	const seek = useCallback((time: number) => {
		if (!audioRef.current) return;
		audioRef.current.currentTime = time;
	}, []);

	const setVolumeControl = useCallback((newVolume: number) => {
		if (!audioRef.current) return;
		const clampedVolume = Math.max(0, Math.min(1, newVolume));
		audioRef.current.volume = clampedVolume;
		setState((prev) => ({ ...prev, volume: clampedVolume }));
	}, []);

	const setPlaybackRateControl = useCallback((rate: number) => {
		if (!audioRef.current) return;
		audioRef.current.playbackRate = rate;
		setState((prev) => ({ ...prev, playbackRate: rate }));
	}, []);

	const toggle = useCallback(async () => {
		if (state.isPlaying) {
			pause();
		} else {
			await play();
		}
	}, [state.isPlaying, play, pause]);

	const reset = useCallback(() => {
		if (!audioRef.current) return;
		audioRef.current.currentTime = 0;
		pause();
	}, [pause]);

	// Setup audio element and event listeners
	useEffect(() => {
		const audio = audioRef.current;
		if (!audio) return;

		// Set initial properties
		audio.loop = loop;
		audio.volume = volume;
		audio.playbackRate = playbackRate;

		if (autoPlay) {
			play();
		}

		// Add event listeners
		audio.addEventListener('loadstart', handleLoadStart);
		audio.addEventListener('loadedmetadata', handleLoadedMetadata);
		audio.addEventListener('canplay', handleCanPlay);
		audio.addEventListener('canplaythrough', handleCanPlayThrough);
		audio.addEventListener('timeupdate', handleTimeUpdate);
		audio.addEventListener('progress', handleProgress);
		audio.addEventListener('play', handlePlay);
		audio.addEventListener('pause', handlePause);
		audio.addEventListener('ended', handleEnded);
		audio.addEventListener('error', handleError);
		audio.addEventListener('waiting', handleWaiting);
		audio.addEventListener('playing', handlePlaying);

		return () => {
			audio.removeEventListener('loadstart', handleLoadStart);
			audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
			audio.removeEventListener('canplay', handleCanPlay);
			audio.removeEventListener('canplaythrough', handleCanPlayThrough);
			audio.removeEventListener('timeupdate', handleTimeUpdate);
			audio.removeEventListener('progress', handleProgress);
			audio.removeEventListener('play', handlePlay);
			audio.removeEventListener('pause', handlePause);
			audio.removeEventListener('ended', handleEnded);
			audio.removeEventListener('error', handleError);
			audio.removeEventListener('waiting', handleWaiting);
			audio.removeEventListener('playing', handlePlaying);
		};
	}, [
		src,
		loop,
		volume,
		playbackRate,
		autoPlay,
		play,
		handleLoadStart,
		handleLoadedMetadata,
		handleCanPlay,
		handleCanPlayThrough,
		handleTimeUpdate,
		handleProgress,
		handlePlay,
		handlePause,
		handleEnded,
		handleError,
		handleWaiting,
		handlePlaying
	]);

	const controls: AudioPlayerControls = {
		play,
		pause,
		seek,
		setVolume: setVolumeControl,
		setPlaybackRate: setPlaybackRateControl,
		toggle,
		reset
	};

	return {
		audioRef,
		state,
		controls
	};
};
