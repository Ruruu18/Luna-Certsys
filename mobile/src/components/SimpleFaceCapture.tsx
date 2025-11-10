import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
  Image,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';

interface SimpleFaceCaptureProps {
  onCapture: (photoUri: string) => void;
  onCancel: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function SimpleFaceCapture({ onCapture, onCancel }: SimpleFaceCaptureProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);

  const cameraRef = useRef<any>(null);

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color={theme.colors.textSecondary} />
          <Text style={styles.permissionText}>Camera permission required</Text>
          <Text style={styles.permissionSubtext}>
            We need access to your camera to capture your face photo
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleCapture = async () => {
    if (!cameraRef.current || isCapturing) {
      return;
    }

    try {
      setIsCapturing(true);

      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
        base64: false,
      });

      // Crop to square (centered)
      const croppedPhoto = await cropToSquare(photo.uri);
      setCapturedPhoto(croppedPhoto);
    } catch (error) {
      console.error('Error capturing photo:', error);
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
      setIsCapturing(false);
    }
  };

  const cropToSquare = async (photoUri: string): Promise<string> => {
    try {
      // Get image dimensions
      const { width, height } = await new Promise<{ width: number; height: number }>(
        (resolve, reject) => {
          Image.getSize(
            photoUri,
            (width, height) => resolve({ width, height }),
            reject
          );
        }
      );

      // Calculate square crop (centered)
      const size = Math.min(width, height);
      const x = (width - size) / 2;
      const y = (height - size) / 2;

      const manipResult = await ImageManipulator.manipulateAsync(
        photoUri,
        [
          {
            crop: {
              originX: x,
              originY: y,
              width: size,
              height: size,
            },
          },
          {
            resize: {
              width: 512,
            },
          },
        ],
        {
          compress: 0.9,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      return manipResult.uri;
    } catch (error) {
      console.error('Error cropping photo:', error);
      return photoUri;
    }
  };

  const handleConfirm = () => {
    if (capturedPhoto) {
      onCapture(capturedPhoto);
    }
  };

  const handleRetry = () => {
    setCapturedPhoto(null);
    setIsCapturing(false);
  };

  // If photo captured, show preview
  if (capturedPhoto) {
    return (
      <View style={styles.container}>
        <View style={styles.previewContainer}>
          <Text style={styles.previewTitle}>Review Your Photo</Text>
          <Image source={{ uri: capturedPhoto }} style={styles.previewImage} />
          <Text style={styles.previewText}>Is this photo acceptable?</Text>

          <View style={styles.previewActions}>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <Ionicons name="refresh" size={24} color="white" />
              <Text style={styles.retryButtonText}>Retake</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
              <Ionicons name="checkmark" size={24} color="white" />
              <Text style={styles.confirmButtonText}>Use This Photo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="front"
      >
        {/* Face guide overlay */}
        <View style={styles.guideOverlay}>
          <View style={styles.guideCircle} />
        </View>

        {/* Top instruction bar */}
        <View style={styles.topBar}>
          <Text style={styles.instructionText}>Center your face in the circle</Text>
        </View>

        {/* Bottom controls */}
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.cancelButtonBottom} onPress={onCancel}>
            <Ionicons name="close" size={28} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.captureButton, isCapturing && styles.captureButtonDisabled]}
            onPress={handleCapture}
            disabled={isCapturing}
          >
            {isCapturing ? (
              <ActivityIndicator size="large" color="white" />
            ) : (
              <View style={styles.captureButtonInner} />
            )}
          </TouchableOpacity>

          <View style={styles.placeholder} />
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  permissionText: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  permissionSubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  cancelButtonText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
  },
  guideOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideCircle: {
    width: SCREEN_WIDTH * 0.7,
    height: SCREEN_WIDTH * 0.7,
    borderRadius: SCREEN_WIDTH * 0.35,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    borderStyle: 'dashed',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  instructionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingBottom: 40,
    paddingTop: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cancelButtonBottom: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: theme.colors.primary,
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primary,
  },
  placeholder: {
    width: 56,
  },
  previewContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: 20,
    justifyContent: 'center',
  },
  previewTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  previewImage: {
    width: SCREEN_WIDTH - 40,
    height: SCREEN_WIDTH - 40,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 20,
  },
  previewText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  previewActions: {
    flexDirection: 'row',
    gap: 12,
  },
  retryButton: {
    flex: 1,
    backgroundColor: theme.colors.textSecondary,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
