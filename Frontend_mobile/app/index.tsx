import { Redirect } from "expo-router"

export default function Index() {
  const isLoggedIn = false

  if (isLoggedIn) {
    return <Redirect href="/(tabs)/feed" />
  }

  return <Redirect href="/(auth)/login" />
}