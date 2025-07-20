'use client';

import React, { Component, createRef, ReactNode, CSSProperties } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Play, Pause } from 'lucide-react';
import { AUDIO_PRELOAD_ATTRIBUTE, TIME_FORMAT } from './constants';

interface RoundAudioPlayerProps {
	/**
	 * HTML5 Audio tag src property
	 */
	src?: string;
	/**
	 * HTML5 Audio tag autoPlay property
	 */
	autoPlay?: boolean;
	/**
	 * Whether to play audio after src prop is changed
	 */
	autoPlayAfterSrcChange?: boolean;
	/**
	 * HTML5 Audio tag preload property
	 */
	preload?: AUDIO_PRELOAD_ATTRIBUTE;
	/**
	 * custom classNames
	 */
	className?: string;
	/**
	 * Component size
	 */
	size?: 'sm' | 'md' | 'lg';
	/**
	 * Time format
	 */
	timeFormat?: TIME_FORMAT;
	/**
	 * Default current time display
	 */
	defaultCurrentTime?: ReactNode;
	/**
	 * Default duration display
	 */
	defaultDuration?: ReactNode;
	/**
	 * Initial volume
	 */
	volume?: number;
	/**
	 * Whether audio is muted
	 */
	muted?: boolean;
	/**
	 * Whether audio should loop
	 */
	loop?: boolean;
	/**
	 * Cross origin attribute
	 */
	crossOrigin?: React.AudioHTMLAttributes<HTMLAudioElement>['crossOrigin'];
	/**
	 * Media group
	 */
	mediaGroup?: string;
	/**
	 * Event handlers
	 */
	onAbort?: (e: Event) => void;
	onCanPlay?: (e: Event) => void;
	onCanPlayThrough?: (e: Event) => void;
	onEnded?: (e: Event) => void;
	onPlaying?: (e: Event) => void;
	onSeeking?: (e: Event) => void;
	onSeeked?: (e: Event) => void;
	onStalled?: (e: Event) => void;
	onSuspend?: (e: Event) => void;
	onLoadStart?: (e: Event) => void;
	onLoadedMetaData?: (e: Event) => void;
	onLoadedData?: (e: Event) => void;
	onWaiting?: (e: Event) => void;
	onEmptied?: (e: Event) => void;
	onError?: (e: Event) => void;
	onListen?: (e: Event) => void;
	onVolumeChange?: (e: Event) => void;
	onPause?: (e: Event) => void;
	onPlay?: (e: Event) => void;
	onPlayError?: (err: Error) => void;
	/**
	 * Component style
	 */
	style?: CSSProperties;
	/**
	 * Children (e.g., track elements)
	 */
	children?: ReactNode;
}

interface RoundAudioPlayerState {
	currentTime: number;
	duration: number;
	isPlaying: boolean;
}

class RoundAudioPlayer extends Component<
	RoundAudioPlayerProps,
	RoundAudioPlayerState
> {
	audio = createRef<HTMLAudioElement>();
	lastVolume: number = this.props.volume ?? 1;

	// Size configurations
	sizeConfig = {
		sm: {
			container: 'w-16 h-16',
			button: 'w-12 h-12',
			icon: 'h-4 w-4',
			rings: [80, 100, 120]
		},
		md: {
			container: 'w-24 h-24',
			button: 'w-16 h-16',
			icon: 'h-6 w-6',
			rings: [120, 150, 180]
		},
		lg: {
			container: 'w-32 h-32',
			button: 'w-24 h-24',
			icon: 'h-8 w-8',
			rings: [160, 200, 240]
		}
	};

	constructor(props: RoundAudioPlayerProps) {
		super(props);
		this.state = {
			currentTime: 0,
			duration: 0,
			isPlaying: false
		};
	}

	togglePlay = (e: React.SyntheticEvent): void => {
		e.stopPropagation();
		const audio = this.audio.current;
		if (!audio) return;
		if ((audio.paused || audio.ended) && audio.src) {
			this.playAudioPromise();
		} else if (!audio.paused) {
			audio.pause();
		}
	};

	/**
	 * Safely play audio
	 */
	playAudioPromise = (): void => {
		if (this.audio.current && this.audio.current.error) {
			this.audio.current.load();
		}
		if (!this.audio.current) return;
		const playPromise = this.audio.current.play();
		if (playPromise) {
			playPromise.then(null).catch((err) => {
				const { onPlayError } = this.props;
				onPlayError && onPlayError(new Error(err));
			});
		} else {
			this.forceUpdate();
		}
	};

	isPlaying = (): boolean => {
		const audio = this.audio.current;
		if (!audio) return false;
		return !audio.paused && !audio.ended;
	};

	handlePlay = (e: Event): void => {
		this.setState({ isPlaying: true });
		this.props.onPlay && this.props.onPlay(e);
	};

	handlePause = (e: Event): void => {
		this.setState({ isPlaying: false });
		this.props.onPause && this.props.onPause(e);
	};

	handleEnded = (e: Event): void => {
		this.setState({ isPlaying: false, currentTime: 0 });
		this.props.onEnded && this.props.onEnded(e);
	};

	handleTimeUpdate = (e: Event): void => {
		const audio = this.audio.current;
		if (!audio) return;
		this.setState({
			currentTime: audio.currentTime,
			duration: audio.duration || 0
		});
		this.props.onListen && this.props.onListen(e);
	};

	handleLoadedMetaData = (e: Event): void => {
		const audio = this.audio.current;
		if (!audio) return;
		this.setState({ duration: audio.duration || 0 });
		this.props.onLoadedMetaData && this.props.onLoadedMetaData(e);
	};

	formatTime = (time: number): string => {
		if (!isFinite(time) || time < 0) return '0:00';
		const minutes = Math.floor(time / 60);
		const seconds = Math.floor(time % 60);
		return `${minutes}:${seconds.toString().padStart(2, '0')}`;
	};

	getProgress = (): number => {
		const { currentTime, duration } = this.state;
		if (!duration) return 0;
		return (currentTime / duration) * 100;
	};

	componentDidMount(): void {
		const audio = this.audio.current;
		if (!audio) return;

		// Set initial volume
		if (this.props.muted) {
			audio.volume = 0;
		} else {
			audio.volume = this.lastVolume;
		}

		// Add event listeners
		audio.addEventListener('error', (e: Event) => {
			const target = e.target as HTMLAudioElement;
			if (target.error && target.currentTime === target.duration) {
				return this.props.onEnded && this.props.onEnded(e);
			}
			this.props.onError && this.props.onError(e);
		});

		audio.addEventListener('canplay', (e: Event) => {
			this.props.onCanPlay && this.props.onCanPlay(e);
		});

		audio.addEventListener('canplaythrough', (e: Event) => {
			this.props.onCanPlayThrough && this.props.onCanPlayThrough(e);
		});

		audio.addEventListener('play', this.handlePlay);
		audio.addEventListener('pause', this.handlePause);
		audio.addEventListener('ended', this.handleEnded);
		audio.addEventListener('timeupdate', this.handleTimeUpdate);
		audio.addEventListener('loadedmetadata', this.handleLoadedMetaData);

		audio.addEventListener('playing', (e: Event) => {
			this.props.onPlaying && this.props.onPlaying(e);
		});

		audio.addEventListener('seeking', (e: Event) => {
			this.props.onSeeking && this.props.onSeeking(e);
		});

		audio.addEventListener('seeked', (e: Event) => {
			this.props.onSeeked && this.props.onSeeked(e);
		});

		audio.addEventListener('waiting', (e: Event) => {
			this.props.onWaiting && this.props.onWaiting(e);
		});

		audio.addEventListener('emptied', (e: Event) => {
			this.props.onEmptied && this.props.onEmptied(e);
		});

		audio.addEventListener('stalled', (e: Event) => {
			this.props.onStalled && this.props.onStalled(e);
		});

		audio.addEventListener('suspend', (e: Event) => {
			this.props.onSuspend && this.props.onSuspend(e);
		});

		audio.addEventListener('loadstart', (e: Event) => {
			this.props.onLoadStart && this.props.onLoadStart(e);
		});

		audio.addEventListener('loadeddata', (e: Event) => {
			this.props.onLoadedData && this.props.onLoadedData(e);
		});

		audio.addEventListener('volumechange', (e: Event) => {
			this.props.onVolumeChange && this.props.onVolumeChange(e);
		});

		audio.addEventListener('abort', (e: Event) => {
			this.props.onAbort && this.props.onAbort(e);
		});
	}

	componentDidUpdate(prevProps: RoundAudioPlayerProps): void {
		const { src, autoPlayAfterSrcChange } = this.props;
		if (prevProps.src !== src) {
			if (autoPlayAfterSrcChange) {
				this.playAudioPromise();
			} else {
				this.setState({ isPlaying: false });
			}
		}
	}

	render(): ReactNode {
		const {
			className = '',
			src,
			loop = false,
			preload = 'metadata',
			autoPlay = false,
			crossOrigin,
			mediaGroup,
			children,
			style,
			size = 'md'
		} = this.props;

		const { currentTime, duration, isPlaying } = this.state;
		const config = this.sizeConfig[size];
		const progress = this.getProgress();

		return (
			<div
				className={`relative flex flex-col items-center gap-2 ${className}`}
				style={style}
			>
				{/* Audio element (hidden) */}
				<audio
					ref={this.audio}
					src={src}
					preload={preload}
					autoPlay={autoPlay}
					loop={loop}
					crossOrigin={crossOrigin}
					mediaGroup={mediaGroup}
					controls={false}
				>
					{children}
				</audio>

				{/* Main circular player */}
				<div className={`relative ${config.container}`}>
					{/* Expanding rings when playing */}
					<AnimatePresence>
						{isPlaying && (
							<>
								{config.rings.map((ringSize, index) => (
									<motion.div
										key={`ring-${index}`}
										className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/30"
										style={{
											width: `${ringSize}px`,
											height: `${ringSize}px`
										}}
										initial={{
											scale: 0,
											opacity: 0.8
										}}
										animate={{
											scale: 1.5,
											opacity: 0
										}}
										exit={{
											scale: 0,
											opacity: 0
										}}
										transition={{
											duration: 2,
											repeat: Infinity,
											ease: 'easeOut',
											delay: index * 0.3
										}}
									/>
								))}
							</>
						)}
					</AnimatePresence>

					{/* Progress circle */}
					<svg
						className="absolute inset-0 h-full w-full -rotate-90"
						viewBox="0 0 100 100"
					>
						{/* Background circle */}
						<circle
							cx="50"
							cy="50"
							r="45"
							fill="none"
							stroke="rgba(255, 255, 255, 0.2)"
							strokeWidth="2"
						/>
						{/* Progress circle */}
						<motion.circle
							cx="50"
							cy="50"
							r="45"
							fill="none"
							stroke="rgba(255, 255, 255, 0.8)"
							strokeWidth="3"
							strokeLinecap="round"
							initial={{ pathLength: 0 }}
							animate={{ pathLength: progress / 100 }}
							transition={{ duration: 0.1 }}
							style={{
								pathLength: progress / 100,
								strokeDasharray: '1 1'
							}}
						/>
					</svg>

					{/* Central play/pause button */}
					<motion.div
						className="absolute inset-0 z-10 flex items-center justify-center"
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
					>
						<Button
							variant="ghost"
							size="lg"
							onClick={this.togglePlay}
							className={`${config.button} z-10 rounded-full border-2 border-white/30 bg-white/20 text-white backdrop-blur-sm hover:bg-white/30`}
							aria-label={isPlaying ? 'Pause' : 'Play'}
						>
							<motion.div
								animate={{ scale: isPlaying ? [1, 1.1, 1] : 1 }}
								transition={{
									duration: 1,
									repeat: isPlaying ? Infinity : 0,
									ease: 'easeInOut'
								}}
							>
								{isPlaying ? (
									<Pause className={config.icon} />
								) : (
									<Play className={config.icon} />
								)}
							</motion.div>
						</Button>
					</motion.div>
				</div>

				{/* Time display */}
				{duration > 0 && (
					<motion.div
						className="text-xs font-medium text-white/80"
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.2 }}
					>
						{this.formatTime(currentTime)} / {this.formatTime(duration)}
					</motion.div>
				)}

				{/* Pulse effect for the main button when playing */}
				<AnimatePresence>
					{isPlaying && (
						<motion.div
							className={`absolute ${config.container} top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10`}
							initial={{ scale: 0.8, opacity: 0.5 }}
							animate={{
								scale: [0.8, 1.2, 0.8],
								opacity: [0.5, 0.2, 0.5]
							}}
							exit={{ scale: 0.8, opacity: 0 }}
							transition={{
								duration: 2,
								repeat: Infinity,
								ease: 'easeInOut'
							}}
						/>
					)}
				</AnimatePresence>
			</div>
		);
	}
}

export default RoundAudioPlayer;
export { RoundAudioPlayer };
