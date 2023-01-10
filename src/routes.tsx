import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import Main from './pages/Main';
import Profile from './pages/Profile';

const { Navigator, Screen } = createStackNavigator();

export default function Routes() {
    return (
        <NavigationContainer>
            <Navigator
                initialRouteName="Main"
                screenOptions={{
                    headerMode: 'screen',
                    headerTintColor: 'white',
                    headerStyle: { backgroundColor: '#021A62' },
                    headerBackTitleVisible: false,
                }}
            >
                <Screen
                    name="Main"
                    component={Main}
                    options={{
                        title: 'DevFinder',
                    }}
                />
                <Screen
                    name="Profile"
                    component={Profile}
                    options={{
                        title: 'Github Profile',
                    }}
                />
            </Navigator>
        </NavigationContainer>
    );
}
