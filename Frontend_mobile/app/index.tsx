import "./global.css";
import { Text, View } from "react-native";

export default function App() {
    return (
        <View className="flex-1 justify-center items-center bg-white p-4">
            <Text className="text-lg font-bold text-center text-gray-700">hello world</Text>
        </View>
    );
}