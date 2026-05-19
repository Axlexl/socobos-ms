import { router } from 'expo-router';
import { useNavigationLoading } from '../context/NavigationLoadingContext';

type AnyHref = Parameters<typeof router.push>[0];

/**
 * Drop-in replacement for `router.push` / `router.replace` / `router.back`
 * that automatically shows the loading screen before navigating.
 *
 * Usage:
 *   const nav = useNav();
 *   nav.push('/rooms');
 *   nav.replace('/home');
 *   nav.back();
 */
export function useNav() {
  const { showLoader } = useNavigationLoading();

  return {
    push: (href: AnyHref, message = 'Loading...') => {
      showLoader(message, 500);
      // Small delay so the loader renders before the new screen mounts
      setTimeout(() => router.push(href), 80);
    },

    replace: (href: AnyHref, message = 'Loading...') => {
      showLoader(message, 500);
      setTimeout(() => router.replace(href), 80);
    },

    back: (message = 'Loading...') => {
      showLoader(message, 400);
      setTimeout(() => router.back(), 80);
    },
  };
}
