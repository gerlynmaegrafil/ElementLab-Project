import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="home" options={{ headerShown: false }} />
        <Stack.Screen name="compare" options={{ headerShown: false }} />
        <Stack.Screen name="trends" options={{ headerShown: false }} />
        <Stack.Screen name="simulator" options={{ headerShown: false }} />
        <Stack.Screen name="activity" options={{ headerShown: false }} />
        <Stack.Screen name="elego/index" options={{ headerShown: false }} />
        <Stack.Screen name="elego/teacher" options={{ headerShown: false }} />
        <Stack.Screen name="elego/student" options={{ headerShown: false }} />   
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
