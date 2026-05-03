import { useEffect } from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { initDatabase } from './src/database';
import AddTradeScreen from './src/screens/addTradeScreen';
import DailyViewScreen from './src/screens/dailyViewScreen';
import MonthlyViewScreen from './src/screens/monthlyViewScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  useEffect(() => {
    initDatabase();
  }, []);

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: true,
          tabBarActiveTintColor: '#3498db',
          tabBarInactiveTintColor: '#95a5a6',
        }}
      >
        <Tab.Screen
          name="Add Trade"
          component={AddTradeScreen}
          options={{
            title: 'Add Trade',
            tabBarLabel: 'Add Trade',
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>➕</Text>,
          }}
        />
        <Tab.Screen
          name="Daily View"
          component={DailyViewScreen}
          options={{
            title: 'Daily View',
            tabBarLabel: 'Daily View',
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📊</Text>,
          }}
        />
        <Tab.Screen
          name="Monthly View"
          component={MonthlyViewScreen}
          options={{
            title: 'Monthly View',
            tabBarLabel: 'Monthly View',
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📈</Text>,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}