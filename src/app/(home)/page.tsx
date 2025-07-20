'use client';

import H5AudioPlayer from '@/audio';
import MyCookieConsent from '@/hooks/use-cookie-consent';

export default function Home() {
	return (
		<>
			<MyCookieConsent />
			<main className="flex min-h-screen flex-col items-center justify-between p-24 text-4xl">
				Hello from landing page
				<H5AudioPlayer
					src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3"
					volume={0.5}
				/>
			</main>
		</>
	);
}
