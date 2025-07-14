import { Link } from 'expo-router';
import { Text, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white p-5">
      <Text className="text-2xl font-bold">Page not found</Text>
      <Link href="/" className="mt-4 text-blue-500">
        Go to home screen
      </Link>
    </View>
  );
}
