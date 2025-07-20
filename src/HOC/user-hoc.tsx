// Description : This HOC should be used to protect routes and refresh user access
//  Update this file with the actual API call to refresh the user data

import { useUserStore } from '@/store/user';
import { Loader } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

const withUserAuthRequired = (ChildComponent: React.ComponentType<any>) => {
	const AuthWrapper = (props: any) => {
		const userStore = useUserStore((state) => state);
		const [isLoading, setIsLoading] = useState<boolean>(true);
		const router = useRouter();

		async function fetchUserDetails() {
			// TODO: Update this function with the actual API call to refresh the user data
			let response: any;

			if (!response) {
				setIsLoading(false);
				return router.push('/auth/login');
			}

			const user = response.data.user;

			// Set global user state
			userStore.setBuyerDetails({
				id: user._id,
				name: user.name,
				image: user.image,
				bio: user.bio,
				preferences: {
					location: user.preferences.location,
					age: user.preferences.age,
					body: user.preferences.body,
					bust: user.preferences.bust
				},
				stats: {
					balance: user.stats.balance,
					totalSpent: user.stats.totalSpent
				},
				email: user.email,
				phone: user.phone,
				password: user.password,
				favourites: user.favourites,
				lastLogin: user.lastLogin
			});

			setIsLoading(false);
		}

		useEffect(() => {
			if (!userStore.isLoggedIn) {
				fetchUserDetails();
			} else {
				setIsLoading(false);
			}
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, []);

		if (isLoading) {
			return (
				<div className="absolute bottom-0 left-0 right-0 top-0 z-50 flex h-screen w-screen flex-col items-center justify-center bg-white">
					<Loader className="animate-spin text-gray-300" size={32} />
					<p className="text-sm text-gray-600">Loading...</p>
				</div>
			);
		}

		return <ChildComponent {...props} />;
	};

	AuthWrapper.displayName = `withUserAuthRequired(${ChildComponent.displayName || 'Component'})`;
	return AuthWrapper;
};

withUserAuthRequired.displayName = 'withUserAuthRequired';

export default withUserAuthRequired;
