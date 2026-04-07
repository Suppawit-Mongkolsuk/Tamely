import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="feed" />
      <Tabs.Screen name="chats" />
      <Tabs.Screen name="ai" />
      <Tabs.Screen name="alerts" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}