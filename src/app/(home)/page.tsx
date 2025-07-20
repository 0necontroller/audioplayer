'use client';

import H5AudioPlayer from '@/audio';
import WhatsappAudioPlayer from '@/components/WhatsappAudioPlayer';
import MyCookieConsent from '@/hooks/use-cookie-consent';

export default function Home() {
	return (
		<>
			<MyCookieConsent />
			<main className="flex min-h-screen flex-col items-center justify-center space-y-8">
				<h1 className="mb-8 text-center text-4xl font-bold">
					Audio Player Demo
				</h1>

				{/* WhatsApp Style Audio Players */}
				<div className="w-full max-w-md space-y-4">
					<h2 className="text-xl font-semibold">WhatsApp Style Audio Player</h2>

					{/* Received message style */}
					<WhatsappAudioPlayer
						src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3"
						duration="7:51"
						isReceived={true}
					/>

					{/* Sent message style */}
					<WhatsappAudioPlayer
						src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
						duration="2:35"
						isReceived={false}
					/>

					{/* Another received message */}
					<WhatsappAudioPlayer
						src="https://space-cdn.whatido.app/v2/audio/1752995560354-56abc3e5-8507-41fb-9d8e-026edd7afe20.mp3"
						duration="4:12"
						isReceived={true}
					/>
				</div>

				{/* Original Audio Player for comparison */}
				<div className="w-full max-w-md space-y-4">
					<h2 className="text-xl font-semibold">Original Audio Player</h2>
					<H5AudioPlayer
						src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3"
						volume={0.5}
					/>
				</div>
			</main>
		</>
	);
}
