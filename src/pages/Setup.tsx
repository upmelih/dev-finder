import { Alert, KeyboardAvoidingView, StyleSheet, TextInput, View } from 'react-native';
import { DEFAULT_LOCATION, tryGetCurrentPosition } from '../utils/location';
import MapView, { LatLng, MapPressEvent, Marker, PoiClickEvent, Region } from 'react-native-maps';
import React, { useContext, useEffect, useState } from 'react';

import { AuthenticationContext } from '../context/AuthenticationContext';
import BigButton from '../components/BigButton';
import Spinner from 'react-native-loading-spinner-overlay';
import { StackScreenProps } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import axios from 'axios';
import { getUserInfo as getGitHubUserInfo } from '../services/github';
import { postUser } from '../services/users';

export default function Setup({ navigation }: StackScreenProps<any>) {
    const authenticationContext = useContext(AuthenticationContext);
    const [username, setUsername] = useState('');

    const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);

    const [markerLocation, setMarkerLocation] = useState<LatLng>(DEFAULT_LOCATION);
    const [currentRegion, setCurrentRegion] = useState<Region>({
        ...DEFAULT_LOCATION,
        latitudeDelta: 0.004,
        longitudeDelta: 0.004,
    });

    useEffect(() => {
        tryGetCurrentPosition()
            .then((curPos: LatLng) => {
                setMarkerLocation(curPos);
                setCurrentRegion({ ...currentRegion, ...curPos });
            })
            .catch(() => {
                /* do nothing and keep the default location and region */
            });
    }, []);

    /**
     * Updates the marker location on the map when the user presses on the map or on a point of interest.
     * @param event The event object containing the coordinate of the press.
     */
    function handleMapPress(event: MapPressEvent | PoiClickEvent): void {
        setMarkerLocation(event.nativeEvent.coordinate);
    }

    /**
     * Handles the sign up process by getting the user's GitHub information and posting it to the server.
     * If the user does not exist on GitHub, it rejects with an error message.
     * If there is an error, it rejects with the error object.
     * If the process is successful, it sets the authentication context value and navigates to the Main screen.
     * @returns A promise that resolves when the process is successful and rejects when there is an error.
     * @throws An error if the user does not exist on GitHub or if there is an error posting the user to the server.
     */
    async function handleSignUp(): Promise<void> {
        setIsAuthenticating(true);
        getGitHubUserInfo(username)
            .catch((err) => {
                if (axios.isAxiosError(err) && err.response?.status == 404) {
                    return Promise.reject('There is no such username on GitHub.');
                } else {
                    return Promise.reject(err);
                }
            })
            .then((fromGitHub) =>
                postUser({
                    login: fromGitHub.login,
                    avatar_url: fromGitHub.avatar_url,
                    bio: fromGitHub.bio,
                    company: fromGitHub.company,
                    name: fromGitHub.name,
                    coordinates: markerLocation,
                })
            )
            .then(() => {
                authenticationContext?.setValue(username);
                navigation.replace('Main');
            })
            .catch((err) => Alert.alert(String(err)))
            .finally(() => setIsAuthenticating(false));
    }

    return (
        <>
            <StatusBar style="dark" />
            <View testID="setup-screen" style={styles.container}>
                <MapView
                    onPress={handleMapPress}
                    onPoiClick={handleMapPress}
                    region={currentRegion}
                    style={styles.map}
                    showsUserLocation={true}
                    showsMyLocationButton={false}
                    toolbarEnabled={false}
                    showsIndoors={false}
                    mapType="mutedStandard"
                    mapPadding={{ top: 0, right: 24, bottom: 128, left: 24 }}
                >
                    <Marker coordinate={markerLocation} />
                </MapView>
                <KeyboardAvoidingView style={styles.form} behavior="position">
                    <TextInput
                        testID="input"
                        style={styles.input}
                        autoCapitalize="none"
                        autoCorrect={false}
                        placeholder="Insert your GitHub username"
                        onChangeText={setUsername}
                    />
                    <BigButton testID="button" onPress={handleSignUp} label="Sign Up" color="#000000" />
                </KeyboardAvoidingView>
            </View>
            <Spinner
                visible={isAuthenticating}
                textContent="Authenticating..."
                overlayColor="#031A62BF"
                textStyle={styles.spinnerText}
            />
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },

    map: {
        ...StyleSheet.absoluteFillObject,
    },

    form: {
        position: 'absolute',
        right: 0,
        left: 0,
        bottom: 0,
        padding: 24,
    },

    spinnerText: {
        fontSize: 16,
        color: '#fff',
    },

    input: {
        backgroundColor: '#fff',
        borderColor: '#031b6233',
        borderRadius: 4,
        borderWidth: 1,
        height: 56,
        paddingVertical: 16,
        paddingHorizontal: 24,
        marginBottom: 16,
        color: '#333',
        fontSize: 16,
    },

    error: {
        color: '#fff',
        fontSize: 12,
    },
});
