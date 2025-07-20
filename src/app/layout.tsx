import './globals.css';
import { DM_Sans } from 'next/font/google';
import type { Metadata, Viewport } from 'next';

const dmSans = DM_Sans({
	subsets: ['latin'],
	display: 'swap',
	variable: '--font-dm-sans',
	weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900']
});

export const metadata: Metadata = {
	title: 'Your wesite title | Goes here for now',
	description: 'This is a custom description for your website',
	metadataBase: new URL('https://yourwebsite.com'),
	openGraph: {
		type: 'website',
		locale: 'en_US',
		url: '/',
		images: '/opengraph-image.png' // TODO: Update extension for your image
	},
	robots: {
		index: true,
		follow: true,
		nocache: true,
		googleBot: {
			'index': true,
			'follow': true,
			'noimageindex': false,
			'max-video-preview': -1,
			'max-image-preview': 'large',
			'max-snippet': -1
		}
	},
	keywords: ['Add', 'your', 'keywords', 'here'],
	category: 'Add your category here'
};
export const viewport: Viewport = {
	width: 'device-width',
	initialScale: 1,
	maximumScale: 1
};

export default function RootLayout({
	children
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body className={dmSans.className}>{children}</body>
		</html>
	);
}
