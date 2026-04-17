import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Index() {
  const [ready, setReady] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('token').then((token) => {
      setHasToken(!!token);
      setReady(true);
    });
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#425C95" />
      </View>
    );
  }

  if (hasToken) {
    return <Redirect href="/(workspace)/workspace" />;
  }

  return <Redirect href="/(auth)/login" />;
}
