import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Animated,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { theme } from '../styles/theme';
import StatusBarWrapper from '../components/StatusBarWrapper';
import { dimensions, spacing, fontSize, borderRadius, scale, verticalScale, moderateScale } from '../utils/responsive';

// Google Maps API Key - Loaded from environment variables
const GOOGLE_MAPS_APIKEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

if (!GOOGLE_MAPS_APIKEY) {
  console.warn('Google Maps API key not configured. Please set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in your .env file');
}

interface MapScreenProps {
  navigation: any;
}

interface PurokMarker {
  id: string;
  name: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  description: string;
  chairman?: string;
  households?: number;
  locationType?: string;
  puroks?: string;
}

export default function MapScreen({ navigation }: MapScreenProps) {
  const mapRef = useRef<MapView>(null);
  const [selectedMarker, setSelectedMarker] = useState<PurokMarker | null>(null);
  const [mapType, setMapType] = useState<'standard' | 'satellite' | 'hybrid'>('standard');
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean>(false);
  const [showDirections, setShowDirections] = useState<boolean>(false);
  const [directionsDistance, setDirectionsDistance] = useState<string>('');
  const [directionsDuration, setDirectionsDuration] = useState<string>('');
  const [distanceToDestination, setDistanceToDestination] = useState<number | null>(null);
  const slideAnim = useRef(new Animated.Value(-300)).current;
  const isAnimating = useRef(false); // Prevent double-click issues
  const markerPressTimeout = useRef<NodeJS.Timeout | null>(null);

  // Barangay Luna main location (Barangay Hall)
  // Exact coordinates from Google Maps - Plus Code: QF7M+F6V
  const barangayLunaLocation = {
    latitude: 9.7637,
    longitude: 125.4831,
    latitudeDelta: 0.003,
    longitudeDelta: 0.003,
  };

  // Barangay Hall marker
  const barangayMarker: PurokMarker = {
    id: 'brgy-luna-hall',
    name: 'Brgy. Luna Hall',
    coordinate: {
      latitude: 9.7637,
      longitude: 125.4831,
    },
    description: 'Brgy. Luna Hall, Surigao City, Surigao del Norte',
    locationType: 'Main Barangay Hall',
  };

  // Sitio Looc & Sitio Toril marker
  const sitioLoocMarker: PurokMarker = {
    id: 'sitio-looc',
    name: 'Sitio Looc & Sitio Toril',
    coordinate: {
      latitude: 9.760772,
      longitude: 125.4835,
    },
    description: 'Sitio Looc & Sitio Toril, Brgy Luna, Surigao City',
    puroks: 'Purok 23 to 26',
    households: 0,
  };

  // Sitio Bacud & Sitio San Vicente marker - Plus Code: PFXP+MWW
  const sitioBacudMarker: PurokMarker = {
    id: 'sitio-bacud',
    name: 'Sitio Bacud & Sitio San Vicente',
    coordinate: {
      latitude: 9.7493,
      longitude: 125.4873,
    },
    description: 'Sitio Bacud & Sitio San Vicente, Barangay Luna, Surigao del Norte',
    puroks: 'Purok 29 to 33',
    households: 0,
  };

  // Bernadette Village marker - Plus Code: QF9P+XJ
  const bernadetteVillageMarker: PurokMarker = {
    id: 'bernadette-village',
    name: 'Bernadette Village',
    coordinate: {
      latitude: 9.7699,
      longitude: 125.4865,
    },
    description: 'Bernadette Village, Barangay Luna, Surigao del Norte',
    puroks: 'Purok 13 to 16',
    households: 0,
  };

  // Sitio Payawan marker - Plus Code: QFGM+MX
  const sitioPayawanMarker: PurokMarker = {
    id: 'sitio-payawan',
    name: 'Sitio Payawan',
    coordinate: {
      latitude: 9.7765,
      longitude: 125.4849,
    },
    description: 'Sitio Payawan, Barangay Luna, Surigao del Norte',
    puroks: 'Purok 1 to 5',
    households: 0,
  };

  // Central Poblacion marker
  const centralPoblacionMarker: PurokMarker = {
    id: 'central-poblacion',
    name: 'Central Poblacion',
    coordinate: {
      latitude: 9.763214,
      longitude: 125.486121,
    },
    description: 'Central Poblacion, Barangay Luna, Surigao del Norte',
    puroks: 'Purok 17 to 22',
    households: 0,
  };

  // Sitio Payawan 2 marker
  const sitioPayawan2Marker: PurokMarker = {
    id: 'sitio-payawan-2',
    name: 'Sitio Payawan 2',
    coordinate: {
      latitude: 9.778010,
      longitude: 125.483045,
    },
    description: 'Sitio Payawan 2, Barangay Luna, Surigao del Norte',
    puroks: 'Purok 6 to 12',
    households: 0,
  };

  // Placeholder purok markers (you'll add actual coordinates later)
  const purokMarkers: PurokMarker[] = [
    barangayMarker,
    sitioLoocMarker,
    sitioBacudMarker,
    bernadetteVillageMarker,
    sitioPayawanMarker,
    centralPoblacionMarker,
    sitioPayawan2Marker,
    // Add more puroks here later
  ];

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (markerPressTimeout.current) {
        clearTimeout(markerPressTimeout.current);
      }
    };
  }, []);

  // Request location permission and start tracking
  useEffect(() => {
    (async () => {
      try {
        // Check if location services are enabled
        const isEnabled = await Location.hasServicesEnabledAsync();

        if (!isEnabled) {
          Alert.alert(
            'Location Services Disabled',
            'Please enable location services in your device settings to use navigation features.',
            [{ text: 'OK' }]
          );
          setLocationPermission(false);
          return;
        }

        // Request permission
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== 'granted') {
          console.log('Location permission denied');
          setLocationPermission(false);
          // Don't show alert - just work without location
          return;
        }

        setLocationPermission(true);

        // Get initial location with timeout
        try {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 10000,
          });

          setUserLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });

          // Watch location for real-time updates
          const subscription = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.Balanced,
              timeInterval: 10000, // Update every 10 seconds
              distanceInterval: 50, // Or every 50 meters
            },
            (location) => {
              setUserLocation({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              });
            }
          );

          // Cleanup subscription on unmount
          return () => {
            subscription.remove();
          };
        } catch (locationError) {
          console.error('Error getting current location:', locationError);
          setLocationPermission(false);
          // Map will work without user location
        }
      } catch (error) {
        console.error('Error setting up location:', error);
        setLocationPermission(false);
        // App continues to work, just without location features
      }
    })();
  }, []);

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  };

  // Check if user has arrived at destination (within 50 meters)
  useEffect(() => {
    if (showDirections && userLocation && selectedMarker) {
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        selectedMarker.coordinate.latitude,
        selectedMarker.coordinate.longitude
      );

      setDistanceToDestination(distance);

      // If within 50 meters (0.05 km), user has arrived
      if (distance <= 0.05) {
        Alert.alert(
          '🎉 You Have Arrived!',
          `You are now at ${selectedMarker.name}`,
          [
            {
              text: 'OK',
              onPress: () => {
                closeDirections();
              }
            }
          ]
        );
      }
    }
  }, [userLocation, showDirections, selectedMarker]);

  const handleMarkerPress = (marker: PurokMarker) => {
    // Debounce: Prevent rapid double-click crashes
    if (isAnimating.current) {
      console.log('Ignoring marker press - animation in progress');
      return;
    }

    // Clear any pending timeouts
    if (markerPressTimeout.current) {
      clearTimeout(markerPressTimeout.current);
    }

    isAnimating.current = true;

    try {
      // Close directions when selecting a new marker
      if (showDirections) {
        setShowDirections(false);
        setDirectionsDistance('');
        setDirectionsDuration('');
        setDistanceToDestination(null);
      }

      setSelectedMarker(marker);

      // Animate info panel
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start(() => {
        // Reset animation flag after animation completes
        isAnimating.current = false;
      });

      // Center map on marker with error handling
      if (mapRef.current && marker.coordinate) {
        try {
          mapRef.current.animateToRegion({
            ...marker.coordinate,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }, 500);
        } catch (mapError) {
          console.error('Error animating map region:', mapError);
        }
      }

      // Reset animation flag after timeout as backup
      markerPressTimeout.current = setTimeout(() => {
        isAnimating.current = false;
      }, 1000);
    } catch (error) {
      console.error('Error handling marker press:', error);
      isAnimating.current = false;
    }
  };

  const closeInfoPanel = () => {
    // Close directions when closing info panel
    if (showDirections) {
      closeDirections();
    }

    Animated.timing(slideAnim, {
      toValue: -300,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setSelectedMarker(null));
  };

  const toggleMapType = () => {
    if (mapType === 'standard') setMapType('satellite');
    else if (mapType === 'satellite') setMapType('hybrid');
    else setMapType('standard');
  };

  const centerOnBarangay = () => {
    if (mapRef.current) {
      mapRef.current.animateToRegion(barangayLunaLocation, 1000);
    }
  };

  const openDirections = () => {
    try {
      if (!selectedMarker || !userLocation) {
        Alert.alert('Location Required', 'Please enable location services to get directions from your current location.');
        return;
      }

      if (!GOOGLE_MAPS_APIKEY) {
        Alert.alert('Configuration Error', 'Google Maps API key is not configured. Directions are unavailable.');
        return;
      }

      // Show directions inside the map
      setShowDirections(true);

      // Fit the map to show both origin and destination with error handling
      if (mapRef.current) {
        try {
          mapRef.current.fitToCoordinates(
            [userLocation, selectedMarker.coordinate],
            {
              edgePadding: {
                top: verticalScale(100),
                right: scale(50),
                bottom: verticalScale(350),
                left: scale(50),
              },
              animated: true,
            }
          );
        } catch (fitError) {
          console.error('Error fitting map coordinates:', fitError);
          // Continue anyway - directions will still work
        }
      }
    } catch (error) {
      console.error('Error opening directions:', error);
      Alert.alert('Error', 'Unable to open directions. Please try again.');
    }
  };

  const closeDirections = () => {
    setShowDirections(false);
    setDirectionsDistance('');
    setDirectionsDuration('');
    setDistanceToDestination(null);
  };

  const centerOnUserLocation = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }, 1000);
    } else {
      Alert.alert('Location Unavailable', 'Your location is not available. Please enable location services.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBarWrapper backgroundColor={theme.colors.primary} style="light" />

      {/* Header */}
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.secondary]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => navigation.openDrawer()}
          >
            <Ionicons name="menu" size={moderateScale(24)} color="white" />
          </TouchableOpacity>

          <Text style={styles.title}>Barangay Map</Text>

          <TouchableOpacity
            style={styles.mapTypeButton}
            onPress={toggleMapType}
          >
            <Ionicons name="layers" size={moderateScale(24)} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Map */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={barangayLunaLocation}
        mapType={mapType}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
        showsBuildings={true}
        showsTraffic={false}
      >
        {/* Directions Route */}
        {showDirections && userLocation && selectedMarker && GOOGLE_MAPS_APIKEY && (
          <MapViewDirections
            origin={userLocation}
            destination={selectedMarker.coordinate}
            apikey={GOOGLE_MAPS_APIKEY}
            strokeWidth={5}
            strokeColor={theme.colors.primary}
            optimizeWaypoints={true}
            mode="DRIVING"
            resetOnChange={false}
            onStart={(params) => {
              try {
                console.log(`Started routing between "${params.origin}" and "${params.destination}"`);
              } catch (error) {
                console.error('Error in onStart:', error);
              }
            }}
            onReady={(result) => {
              try {
                console.log(`Distance: ${result.distance} km`);
                console.log(`Duration: ${result.duration} min.`);
                setDirectionsDistance(`${result.distance.toFixed(1)} km`);
                setDirectionsDuration(`${Math.round(result.duration)} min`);
              } catch (error) {
                console.error('Error in onReady:', error);
              }
            }}
            onError={(errorMessage) => {
              try {
                console.error('Directions Error:', errorMessage);

                // Safely close directions on error
                setShowDirections(false);
                setDirectionsDistance('');
                setDirectionsDuration('');

                // Check if it's an API not enabled error
                if (errorMessage && (errorMessage.includes('legacy API') || errorMessage.includes('not enabled'))) {
                  Alert.alert(
                    'API Not Enabled',
                    'The Directions API is not enabled in your Google Cloud Console.\n\n' +
                    '1. Go to console.cloud.google.com\n' +
                    '2. Select your project\n' +
                    '3. Go to "APIs & Services" → "Library"\n' +
                    '4. Search "Directions API" and click ENABLE',
                    [{ text: 'OK' }]
                  );
                } else {
                  Alert.alert('Directions Error', 'Unable to find route. Please check your internet connection.');
                }
              } catch (error) {
                console.error('Error in onError handler:', error);
                setShowDirections(false);
              }
            }}
          />
        )}

        {purokMarkers.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={marker.coordinate}
            title={marker.name}
            description={marker.description}
            onPress={() => {
              try {
                handleMarkerPress(marker);
              } catch (error) {
                console.error('Error in marker press:', error);
              }
            }}
          >
            <View style={styles.markerContainer}>
              <View style={[
                styles.markerPin,
                marker.id === 'brgy-luna-hall' ? styles.mainMarker : styles.purokMarker
              ]}>
                <Ionicons
                  name={marker.id === 'brgy-luna-hall' ? 'business' : 'location'}
                  size={moderateScale(20)}
                  color="white"
                />
              </View>
              <View style={styles.markerArrow} />
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Floating Action Buttons */}
      <View style={styles.floatingButtons}>
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={centerOnBarangay}
        >
          <Ionicons name="compass" size={moderateScale(22)} color={theme.colors.primary} />
        </TouchableOpacity>

        {locationPermission && (
          <TouchableOpacity
            style={[styles.floatingButton, styles.myLocationButton]}
            onPress={centerOnUserLocation}
          >
            <Ionicons name="locate" size={moderateScale(22)} color="white" />
          </TouchableOpacity>
        )}
      </View>

      {/* Info Panel */}
      {selectedMarker && (
        <Animated.View
          style={[
            styles.infoPanel,
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          <View style={styles.infoPanelHeader}>
            <View style={styles.infoPanelDrag} />
          </View>

          <View style={styles.infoPanelContent}>
            <View style={styles.infoPanelTitleRow}>
              <View style={styles.infoPanelIcon}>
                <Ionicons
                  name={selectedMarker.id === 'brgy-luna-hall' ? 'business' : 'location'}
                  size={moderateScale(24)}
                  color={theme.colors.primary}
                />
              </View>
              <View style={styles.infoPanelTitleContainer}>
                <Text style={styles.infoPanelTitle}>{selectedMarker.name}</Text>
                <Text style={styles.infoPanelSubtitle}>{selectedMarker.description}</Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeInfoPanel}
              >
                <Ionicons name="close" size={moderateScale(24)} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedMarker.locationType && (
              <View style={styles.infoRow}>
                <Ionicons name="business" size={moderateScale(18)} color={theme.colors.primary} />
                <Text style={styles.infoLabel}>Building:</Text>
                <Text style={styles.infoValue}>{selectedMarker.locationType}</Text>
              </View>
            )}

            {selectedMarker.puroks && (
              <View style={styles.infoRow}>
                <Ionicons name="list" size={moderateScale(18)} color={theme.colors.primary} />
                <Text style={styles.infoLabel}>Puroks:</Text>
                <Text style={styles.infoValue}>{selectedMarker.puroks}</Text>
              </View>
            )}

            {selectedMarker.chairman && (
              <View style={styles.infoRow}>
                <Ionicons name="person" size={moderateScale(18)} color={theme.colors.primary} />
                <Text style={styles.infoLabel}>Chairman:</Text>
                <Text style={styles.infoValue}>{selectedMarker.chairman}</Text>
              </View>
            )}

            {selectedMarker.households !== undefined && selectedMarker.households > 0 && (
              <View style={styles.infoRow}>
                <Ionicons name="home" size={moderateScale(18)} color={theme.colors.primary} />
                <Text style={styles.infoLabel}>Households:</Text>
                <Text style={styles.infoValue}>{selectedMarker.households}</Text>
              </View>
            )}

            {showDirections && directionsDistance && (
              <View style={styles.routeInfo}>
                <View style={styles.routeInfoItem}>
                  <Ionicons name="car" size={moderateScale(20)} color={theme.colors.primary} />
                  <Text style={styles.routeInfoText}>{directionsDistance}</Text>
                </View>
                <View style={styles.routeInfoItem}>
                  <Ionicons name="time" size={moderateScale(20)} color={theme.colors.primary} />
                  <Text style={styles.routeInfoText}>{directionsDuration}</Text>
                </View>
                {distanceToDestination !== null && distanceToDestination > 0.05 && (
                  <View style={styles.routeInfoItem}>
                    <Ionicons name="location" size={moderateScale(20)} color={theme.colors.success} />
                    <Text style={[styles.routeInfoText, { color: theme.colors.success }]}>
                      {distanceToDestination < 1
                        ? `${Math.round(distanceToDestination * 1000)} m away`
                        : `${distanceToDestination.toFixed(1)} km away`}
                    </Text>
                  </View>
                )}
              </View>
            )}

            <View style={styles.buttonRow}>
              {!showDirections ? (
                <TouchableOpacity
                  style={styles.directionsButton}
                  onPress={openDirections}
                >
                  <Ionicons name="navigate" size={moderateScale(18)} color="white" />
                  <Text style={styles.directionsText}>Get Directions</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.directionsButton, styles.closeDirectionsButton]}
                  onPress={closeDirections}
                >
                  <Ionicons name="close-circle" size={moderateScale(18)} color="white" />
                  <Text style={styles.directionsText}>Close Directions</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Animated.View>
      )}

      {/* Map Type Indicator */}
      <View style={styles.mapTypeIndicator}>
        <Text style={styles.mapTypeText}>
          {mapType === 'standard' ? 'Standard' : mapType === 'satellite' ? 'Satellite' : 'Hybrid'}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  menuButton: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    fontFamily: theme.fontFamily.bold,
    color: 'white',
  },
  mapTypeButton: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
  },
  markerPin: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  mainMarker: {
    backgroundColor: theme.colors.error,
    borderWidth: 3,
    borderColor: 'white',
  },
  purokMarker: {
    backgroundColor: theme.colors.primary,
    borderWidth: 3,
    borderColor: 'white',
  },
  markerArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: scale(6),
    borderRightWidth: scale(6),
    borderTopWidth: verticalScale(8),
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'white',
    marginTop: -2,
  },
  floatingButtons: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.xl + verticalScale(20),
    gap: spacing.md,
  },
  floatingButton: {
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(28),
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  myLocationButton: {
    backgroundColor: theme.colors.primary,
  },
  infoPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  infoPanelHeader: {
    alignItems: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  infoPanelDrag: {
    width: scale(40),
    height: verticalScale(4),
    borderRadius: borderRadius.sm,
    backgroundColor: theme.colors.border,
  },
  infoPanelContent: {
    padding: spacing.lg,
  },
  infoPanelTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  infoPanelIcon: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    backgroundColor: theme.colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  infoPanelTitleContainer: {
    flex: 1,
  },
  infoPanelTitle: {
    fontSize: fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    fontFamily: theme.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: spacing.xs,
  },
  infoPanelSubtitle: {
    fontSize: fontSize.sm,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
  closeButton: {
    padding: spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: spacing.xs,
  },
  infoLabel: {
    fontSize: fontSize.sm,
    fontFamily: theme.fontFamily.medium,
    color: theme.colors.textSecondary,
    marginLeft: spacing.xs,
  },
  infoValue: {
    fontSize: fontSize.sm,
    fontFamily: theme.fontFamily.semiBold,
    color: theme.colors.text,
    flex: 1,
    textAlign: 'right',
  },
  routeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: theme.colors.primary + '10',
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  routeInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  routeInfoText: {
    fontSize: fontSize.md,
    fontWeight: theme.fontWeight.bold,
    fontFamily: theme.fontFamily.bold,
    color: theme.colors.text,
  },
  buttonRow: {
    marginTop: spacing.md,
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
  },
  closeDirectionsButton: {
    backgroundColor: theme.colors.error,
  },
  directionsText: {
    fontSize: fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fontFamily.semiBold,
    color: 'white',
  },
  mapTypeIndicator: {
    position: 'absolute',
    top: spacing.md + verticalScale(60),
    right: spacing.lg,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  mapTypeText: {
    fontSize: fontSize.xs,
    fontFamily: theme.fontFamily.medium,
    color: theme.colors.text,
  },
});
