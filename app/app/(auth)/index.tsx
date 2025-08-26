import { Redirect } from 'expo-router';

export default function AuthIndex() {
  // Default to signup for new users
  return <Redirect href="/signup" />;
}