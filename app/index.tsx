import { Redirect } from 'expo-router';

// Entry point — redirect to landing
export default function Index() {
  // Cast needed because typed routes don't know about our flat file structure
  return <Redirect href={'/landing' as any} />;
}
