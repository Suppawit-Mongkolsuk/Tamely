import { View, Text, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TestAuthScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  let user = null;
  
  // โซนกันกระสุน: ดักจับ Error ตอนแกะกล่องข้อมูล
  try {
      if (typeof params.user === 'string') {
          user = JSON.parse(params.user);
      } else if (typeof params.user === 'object') {
          user = params.user; // บางที Expo Router ก็แกะมาให้แล้ว
      }
  } catch (error) {
      console.error("Parse error:", error);
  }

  return (
    <SafeAreaView className="flex-1 bg-white items-center justify-center px-6">
      <Text className="text-3xl font-bold text-green-600 mb-6">🎉 Success!</Text>
      
      {user ? (
        <View className="bg-gray-100 p-6 rounded-xl w-full border border-gray-200 shadow-sm">
          <Text className="text-lg font-bold text-[#425C95] mb-4">User Information:</Text>
          
          {/* ใช้ String() ครอบไว้เสมอ ป้องกันบั๊ก React Native แครชเวลาเจอตัวเลข (เช่น ID) */}
          <Text className="text-base text-gray-700 mb-2">
            <Text className="font-bold">ID: </Text> {String(user?.id || '-')}
          </Text>
          <Text className="text-base text-gray-700 mb-2">
            <Text className="font-bold">Name: </Text> {String(user?.fullName || '-')}
          </Text>
          <Text className="text-base text-gray-700 mb-2">
            <Text className="font-bold">Email: </Text> {String(user?.email || '-')}
          </Text>
        </View>
      ) : (
        <View className="items-center">
            <Text className="text-red-500 font-bold mb-2">No user data found or format is invalid.</Text>
            <Text className="text-gray-500 text-sm">ลองเช็คที่ Terminal Backend ดูว่ามีข้อมูลส่งมาไหม</Text>
        </View>
      )}

      <TouchableOpacity 
        className="mt-8 bg-red-500 px-8 py-4 rounded-xl"
        onPress={() => router.replace('/login')}
      >
        <Text className="text-white font-bold text-lg">Back to Login</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}