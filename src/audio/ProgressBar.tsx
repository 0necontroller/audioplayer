import React, { Component, forwardRef, SyntheticEvent } from 'react';
import { getPosX, throttle } from './utils';
import { OnSeek } from './index';

interface ProgressBarForwardRefProps {
	audio: HTMLAudioElement;
	progressUpdateInterval: number;
	showDownloadProgress: boolean;
	showFilledProgress: boolean;
	srcDuration?: number;
	onSeek?: OnSeek;
	onChangeCurrentTimeError?: (err: Error) => void;
	i18nProgressBar: string;
	isReceived?: boolean;
}
interface ProgressBarProps extends ProgressBarForwardRefProps {
	progressBar: React.RefObject<HTMLDivElement>;
}

interface ProgressBarState {
	isDraggingProgress: boolean;
	currentTimePos?: string;
	hasDownloadProgressAnimation: boolean;
	downloadProgressArr: DownloadProgress[];
	waitingForSeekCallback: boolean;
}

interface DownloadProgress {
	left: string;
	width: string;
}

interface TimePosInfo {
	currentTime: number;
	currentTimePos: string;
}

class ProgressBar extends Component<ProgressBarProps, ProgressBarState> {
	audio?: HTMLAudioElement;

	timeOnMouseMove = 0; // Audio's current time while mouse is down and moving over the progress bar

	hasAddedAudioEventListener = false;

	downloadProgressAnimationTimer?: number;

	state: ProgressBarState = {
		isDraggingProgress: false,
		currentTimePos: '0%',
		hasDownloadProgressAnimation: false,
		downloadProgressArr: [],
		waitingForSeekCallback: false
	};

	getDuration(): number {
		const { audio, srcDuration } = this.props;
		return typeof srcDuration === 'undefined' ? audio.duration : srcDuration;
	}

	// Get time info while dragging indicator by mouse or touch
	getCurrentProgress = (event: MouseEvent | TouchEvent): TimePosInfo => {
		const { audio, progressBar } = this.props;
		const isSingleFileProgressiveDownload =
			audio.src.indexOf('blob:') !== 0 &&
			typeof this.props.srcDuration === 'undefined';

		if (
			isSingleFileProgressiveDownload &&
			(!audio.src || !isFinite(audio.currentTime) || !progressBar.current)
		) {
			return { currentTime: 0, currentTimePos: '0%' };
		}

		const progressBarRect = progressBar.current.getBoundingClientRect();
		const maxRelativePos = progressBarRect.width;
		let relativePos = getPosX(event) - progressBarRect.left;

		if (relativePos < 0) {
			relativePos = 0;
		} else if (relativePos > maxRelativePos) {
			relativePos = maxRelativePos;
		}
		const duration = this.getDuration();
		const currentTime = (duration * relativePos) / maxRelativePos;
		return {
			currentTime,
			currentTimePos: `${((relativePos / maxRelativePos) * 100).toFixed(2)}%`
		};
	};

	handleContextMenu = (event: SyntheticEvent): void => {
		event.preventDefault();
	};

	/* Handle mouse down or touch start on progress bar event */
	handleMouseDownOrTouchStartProgressBar = (
		event: React.MouseEvent | React.TouchEvent
	): void => {
		event.stopPropagation();
		const { currentTime, currentTimePos } = this.getCurrentProgress(
			event.nativeEvent
		);

		if (isFinite(currentTime)) {
			this.timeOnMouseMove = currentTime;
			this.setState({ isDraggingProgress: true, currentTimePos });
			if (event.nativeEvent instanceof MouseEvent) {
				window.addEventListener('mousemove', this.handleWindowMouseOrTouchMove);
				window.addEventListener('mouseup', this.handleWindowMouseOrTouchUp);
			} else {
				window.addEventListener('touchmove', this.handleWindowMouseOrTouchMove);
				window.addEventListener('touchend', this.handleWindowMouseOrTouchUp);
			}
		}
	};

	handleWindowMouseOrTouchMove = (event: TouchEvent | MouseEvent): void => {
		if (event instanceof MouseEvent) {
			event.preventDefault();
		}
		event.stopPropagation();
		// Prevent Chrome drag selection bug
		const windowSelection: Selection | null = window.getSelection();
		if (windowSelection && windowSelection.type === 'Range') {
			windowSelection.empty();
		}

		const { isDraggingProgress } = this.state;
		if (isDraggingProgress) {
			const { currentTime, currentTimePos } = this.getCurrentProgress(event);
			this.timeOnMouseMove = currentTime;
			this.setState({ currentTimePos });
		}
	};

	handleWindowMouseOrTouchUp = (event: MouseEvent | TouchEvent): void => {
		event.stopPropagation();
		const newTime = this.timeOnMouseMove;
		const { audio, onChangeCurrentTimeError, onSeek } = this.props;

		if (onSeek) {
			this.setState(
				{ isDraggingProgress: false, waitingForSeekCallback: true },
				() => {
					onSeek(audio, newTime).then(
						() => this.setState({ waitingForSeekCallback: false }),
						(err) => {
							throw new Error(err);
						}
					);
				}
			);
		} else {
			const newProps: { isDraggingProgress: boolean; currentTimePos?: string } =
				{
					isDraggingProgress: false
				};
			if (
				audio.readyState === audio.HAVE_NOTHING ||
				audio.readyState === audio.HAVE_METADATA ||
				!isFinite(newTime)
			) {
				try {
					audio.load();
				} catch (err) {
					newProps.currentTimePos = '0%';
					return (
						onChangeCurrentTimeError && onChangeCurrentTimeError(err as Error)
					);
				}
			}

			audio.currentTime = newTime;
			this.setState(newProps);
		}

		if (event instanceof MouseEvent) {
			window.removeEventListener(
				'mousemove',
				this.handleWindowMouseOrTouchMove
			);
			window.removeEventListener('mouseup', this.handleWindowMouseOrTouchUp);
		} else {
			window.removeEventListener(
				'touchmove',
				this.handleWindowMouseOrTouchMove
			);
			window.removeEventListener('touchend', this.handleWindowMouseOrTouchUp);
		}
	};

	handleAudioTimeUpdate = throttle((e: Event): void => {
		const { isDraggingProgress } = this.state;
		const audio = e.target as HTMLAudioElement;
		if (isDraggingProgress || this.state.waitingForSeekCallback === true)
			return;

		const { currentTime } = audio;
		const duration = this.getDuration();

		this.setState({
			currentTimePos: `${((currentTime / duration) * 100 || 0).toFixed(2)}%`
		});
	}, this.props.progressUpdateInterval);

	handleAudioDownloadProgressUpdate = (e: Event): void => {
		const audio = e.target as HTMLAudioElement;
		const duration = this.getDuration();

		const downloadProgressArr: DownloadProgress[] = [];
		for (let i = 0; i < audio.buffered.length; i++) {
			const bufferedStart: number = audio.buffered.start(i);
			const bufferedEnd: number = audio.buffered.end(i);
			downloadProgressArr.push({
				left: `${Math.round((100 / duration) * bufferedStart) || 0}%`,
				width: `${Math.round((100 / duration) * (bufferedEnd - bufferedStart)) || 0}%`
			});
		}

		clearTimeout(this.downloadProgressAnimationTimer);
		this.setState({ downloadProgressArr, hasDownloadProgressAnimation: true });
		// @ts-expect-error timeout does not expect a number
		this.downloadProgressAnimationTimer = setTimeout(() => {
			this.setState({ hasDownloadProgressAnimation: false });
		}, 200);
	};

	initialize(): void {
		const { audio } = this.props;
		if (audio && !this.hasAddedAudioEventListener) {
			this.audio = audio;
			this.hasAddedAudioEventListener = true;
			audio.addEventListener('timeupdate', this.handleAudioTimeUpdate);
			audio.addEventListener(
				'progress',
				this.handleAudioDownloadProgressUpdate
			);
		}
	}

	componentDidMount(): void {
		this.initialize();
	}

	componentDidUpdate(): void {
		this.initialize();
	}

	componentWillUnmount(): void {
		if (this.audio && this.hasAddedAudioEventListener) {
			this.audio.removeEventListener('timeupdate', this.handleAudioTimeUpdate);
			this.audio.removeEventListener(
				'progress',
				this.handleAudioDownloadProgressUpdate
			);
		}
		clearTimeout(this.downloadProgressAnimationTimer);
	}

	render(): React.ReactNode {
		const {
			showDownloadProgress,
			showFilledProgress,
			progressBar,
			i18nProgressBar,
			isReceived = true
		} = this.props;
		const {
			currentTimePos,
			downloadProgressArr,
			hasDownloadProgressAnimation
		} = this.state;

		// Generate waveform bars with predefined heights for consistent look
		const waveformHeights = [
			8, 12, 6, 14, 10, 16, 8, 12, 15, 9, 11, 7, 13, 18, 10, 6, 14, 12, 8, 16,
			11, 9, 15, 7, 13, 10, 12, 8, 14, 16, 9, 11, 6, 15, 12, 10, 8, 13, 7, 14
		];

		// Colors based on message type
		const playedColor = isReceived ? 'bg-blue-400' : 'bg-white';
		const unplayedColor = isReceived ? 'bg-green-300' : 'bg-blue-200';

		const waveformBars = Array.from({ length: 40 }, (_, index) => {
			const height = waveformHeights[index] || 10;
			const currentProgress = currentTimePos
				? parseFloat(currentTimePos.replace('%', ''))
				: 0;
			const barProgress = (index / 40) * 100;
			const isPlayed = currentProgress > barProgress;

			return (
				<div
					key={index}
					className={`w-0.5 rounded-sm transition-colors duration-200 ${
						isPlayed ? playedColor : unplayedColor
					}`}
					style={{ height: `${height}px` }}
				/>
			);
		});

		return (
			<div
				className="relative flex h-8 cursor-pointer items-center justify-center px-2"
				ref={progressBar}
				aria-label={i18nProgressBar}
				role="progressbar"
				aria-valuemin={0}
				aria-valuemax={100}
				aria-valuenow={
					currentTimePos ? Number(currentTimePos.split('%')[0]) : 0
				}
				tabIndex={0}
				onMouseDown={this.handleMouseDownOrTouchStartProgressBar}
				onTouchStart={this.handleMouseDownOrTouchStartProgressBar}
				onContextMenu={this.handleContextMenu}
			>
				{/* Waveform visualization */}
				<div className="relative flex w-full items-center justify-center gap-1">
					{waveformBars}

					{/* Progress indicator dot */}
					{currentTimePos && (
						<div
							className="absolute h-2.5 w-2.5 rounded-full border border-white bg-blue-500 shadow-lg"
							style={{
								left: currentTimePos,
								top: '50%',
								transform: 'translate(-50%, -50%)'
							}}
						/>
					)}
				</div>

				{/* Download progress bars (hidden in mobile/WhatsApp style) */}
				{showDownloadProgress &&
					downloadProgressArr.map(({ left, width }, i) => (
						<div
							key={i}
							className="absolute h-full bg-gray-400 opacity-50"
							style={{
								left,
								width,
								transitionDuration: hasDownloadProgressAnimation ? '.2s' : '0s'
							}}
						/>
					))}
			</div>
		);
	}
}

const ProgressBarForwardRef = (
	props: ProgressBarForwardRefProps,
	ref: React.Ref<HTMLDivElement>
): React.ReactElement => (
	<ProgressBar
		{...props}
		progressBar={ref as React.RefObject<HTMLDivElement>}
	/>
);

export default forwardRef(ProgressBarForwardRef);
export { ProgressBar, ProgressBarForwardRef };
