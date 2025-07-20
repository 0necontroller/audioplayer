'use client';

import H5AudioPlayer from '@/audio';
import MyCookieConsent from '@/hooks/use-cookie-consent';

export default function Home() {
	return (
		<>
			<MyCookieConsent />
			<main className="flex min-h-screen flex-col items-center justify-center space-y-8">
				<h1 className="mb-8 text-center text-4xl font-bold">
					Audio Player Demo
				</h1>

				{/* Original Audio Player for comparison */}
				<div className="w-full max-w-md space-y-4">
					<h2 className="text-xl font-semibold">
						WhatsApp Style H5AudioPlayer
					</h2>

					{/* Received message style */}
					<H5AudioPlayer
						src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3"
						volume={0.5}
						isReceived={true}
					/>
				</div>
			</main>
		</>
	);
}
