'use client';

import React, { useState } from 'react';
import { WhatsAppAudioPlayer, WhatsAppAudioPlayerAdvanced } from './index';

const TestAudioPlayer = () => {
	const [logs, setLogs] = useState<string[]>([]);

	const addLog = (message: string) => {
		setLogs((prev) => [
			...prev.slice(-9),
			`${new Date().toLocaleTimeString()}: ${message}`
		]);
	};

	const handlePlay = () => addLog('Audio started playing');
	const handlePause = () => addLog('Audio paused');
	const handleEnded = () => addLog('Audio ended');
	const handleError = (error: Event) => addLog(`Audio error: ${error.type}`);
	const handleTimeUpdate = (current: number, total: number) => {
		if (Math.floor(current) % 5 === 0 && current > 0) {
			addLog(`Time update: ${Math.floor(current)}s / ${Math.floor(total)}s`);
		}
	};

	// Test URLs - some good, some bad for testing error handling
	const testUrls = [
		'https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Kangaroo_MusiQue_-_The_Neverwritten_Role_Playing_Game.mp3', // Usually works
		'https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba.mp3', // Alternative
		'https://commondatastorage.googleapis.com/codeskulptor-assets/Epoq-Lepidoptera.ogg', // OGG format
		'https://invalid-url.com/nonexistent.mp3', // Should fail
		'https://httpstat.us/404' // Should fail
	];

	const [currentUrl, setCurrentUrl] = useState(testUrls[0]);

	return (
		<div className="space-y-6 p-6">
			<h2 className="text-2xl font-bold">Audio Player Test Suite</h2>

			{/* URL Selector */}
			<div>
				<label className="mb-2 block text-sm font-medium">
					Test Audio URL:
				</label>
				<select
					value={currentUrl}
					onChange={(e) => setCurrentUrl(e.target.value)}
					className="w-full rounded border p-2"
				>
					{testUrls.map((url, index) => (
						<option key={index} value={url}>
							{url.includes('invalid') || url.includes('404') ? '❌ ' : '✅ '}
							{url}
						</option>
					))}
				</select>
			</div>

			{/* Basic Player Test */}
			<div className="space-y-2">
				<h3 className="text-lg font-semibold">Basic WhatsApp Player</h3>
				<WhatsAppAudioPlayer
					src={currentUrl}
					timestamp="14:32"
					onPlay={handlePlay}
					onPause={handlePause}
					onEnded={handleEnded}
					onTimeUpdate={handleTimeUpdate}
					onError={handleError}
				/>
			</div>

			{/* Advanced Player Test */}
			<div className="space-y-2">
				<h3 className="text-lg font-semibold">Advanced WhatsApp Player</h3>
				<WhatsAppAudioPlayerAdvanced
					src={currentUrl}
					avatarSrc="https://images.unsplash.com/photo-1494790108755-2616b612b77c?w=50&h=50&fit=crop&crop=face"
					timestamp="14:35"
					onPlay={handlePlay}
					onPause={handlePause}
					onEnded={handleEnded}
					onTimeUpdate={handleTimeUpdate}
					onError={handleError}
				/>
			</div>

			{/* Event Log */}
			<div className="space-y-2">
				<h3 className="text-lg font-semibold">Event Log</h3>
				<div className="max-h-60 overflow-y-auto rounded bg-gray-100 p-4">
					{logs.length === 0 ? (
						<p className="text-gray-500">No events yet...</p>
					) : (
						logs.map((log, index) => (
							<div key={index} className="font-mono text-sm">
								{log}
							</div>
						))
					)}
				</div>
				<button
					onClick={() => setLogs([])}
					className="rounded bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
				>
					Clear Log
				</button>
			</div>

			{/* Improvement Notes */}
			<div className="rounded bg-blue-50 p-4">
				<h3 className="mb-2 text-lg font-semibold">🚀 Improvements Made</h3>
				<ul className="space-y-1 text-sm">
					<li>
						✅ Changed preload from "metadata" to "auto" for faster loading
					</li>
					<li>✅ Added comprehensive error handling with visual feedback</li>
					<li>✅ Added canPlay state to prevent premature play attempts</li>
					<li>✅ Added ready state checks before playing audio</li>
					<li>✅ Added automatic error recovery (audio.load() on error)</li>
					<li>✅ Added crossOrigin="anonymous" for better CORS handling</li>
					<li>✅ Added waiting/playing events for better loading states</li>
					<li>✅ Improved spinner logic to show only when necessary</li>
				</ul>
			</div>
		</div>
	);
};

export default TestAudioPlayer;
