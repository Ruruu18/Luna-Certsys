import React, { useState, useEffect, useRef } from 'react';
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
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as FaceDetector from 'expo-face-detector';
import * as ImageManipulator from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';

interface FaceCaptureProps {
  onCapture: (photoUri: string) => void;
  onCancel: () => void;
}

interface DetectedFace {
  bounds: {
    origin: { x: number; y: number };
    size: { width: number; height: number };
  };
  rollAngle?: number;
  yawAngle?: number;
  leftEyeOpenProbability?: number;
  rightEyeOpenProbability?: number;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function FaceCaptureCamera({ onCapture, onCancel }: FaceCaptureProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [detectedFaces, setDetectedFaces] = useState<DetectedFace[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [instruction, setInstruction] = useState('Position your face in the frame');
  const [faceStatus, setFaceStatus] = useState<'none' | 'detected' | 'ready'>('none');

  const cameraRef = useRef<any>(null);
  const wasEyesClosedRef = useRef(false);
  const blinkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (blinkTimeoutRef.current) {
        clearTimeout(blinkTimeoutRef.current);
      }
    };
  }, []);

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

  const handleFacesDetected = ({ faces }: { faces: DetectedFace[] }) => {
    setDetectedFaces(faces);

    if (faces.length === 0) {
      setFaceStatus('none');
      setInstruction('Position your face in the frame');
      wasEyesClosedRef.current = false;
      return;
    }

    if (faces.length > 1) {
      setFaceStatus('none');
      setInstruction('Multiple faces detected. Only one person allowed');
      wasEyesClosedRef.current = false;
      return;
    }

    const face = faces[0];

    // Check face size (not too close, not too far)
    const faceSize = face.bounds.size.width * face.bounds.size.height;
    const screenSize = SCREEN_WIDTH * SCREEN_HEIGHT;
    const faceRatio = faceSize / screenSize;

    if (faceRatio < 0.05) {
      setFaceStatus('detected');
      setInstruction('Move closer to the camera');
      return;
    }

    if (faceRatio > 0.4) {
      setFaceStatus('detected');
      setInstruction('Move back from the camera');
      return;
    }

    // Check face angle
    if (face.rollAngle !== undefined && Math.abs(face.rollAngle) > 20) {
      setFaceStatus('detected');
      setInstruction('Keep your head straight');
      return;
    }

    if (face.yawAngle !== undefined && Math.abs(face.yawAngle) > 20) {
      setFaceStatus('detected');
      setInstruction('Face the camera directly');
      return;
    }

    // Face is good, ready for blink detection
    setFaceStatus('ready');

    // Blink detection
    const leftEyeOpen = face.leftEyeOpenProbability ?? 1;
    const rightEyeOpen = face.rightEyeOpenProbability ?? 1;
    const eyesClosed = leftEyeOpen < 0.3 && rightEyeOpen < 0.3;
    const eyesOpen = leftEyeOpen > 0.7 && rightEyeOpen > 0.7;

    if (eyesClosed) {
      wasEyesClosedRef.current = true;
      setInstruction('Eyes closed...');
    } else if (eyesOpen && wasEyesClosedRef.current) {
      // Blink detected!
      setInstruction('Blink detected! Capturing...');
      wasEyesClosedRef.current = false;

      // Add small delay to ensure face is ready
      if (blinkTimeoutRef.current) {
        clearTimeout(blinkTimeoutRef.current);
      }
      blinkTimeoutRef.current = setTimeout(() => {
        capturePhoto();
      }, 100);
    } else {
      setInstruction('Blink to capture your photo');
    }
  };

  const capturePhoto = async () => {
    if (!cameraRef.current || isCapturing || detectedFaces.length !== 1) {
      return;
    }

    try {
      setIsCapturing(true);
      setInstruction('Processing...');

      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
        base64: false,
      });

      // Crop to face only
      const face = detectedFaces[0];
      const croppedPhoto = await cropToFace(photo.uri, face);

      setCapturedPhoto(croppedPhoto);
      setInstruction('Photo captured! Review your photo below');
    } catch (error) {
      console.error('Error capturing photo:', error);
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
      setIsCapturing(false);
      setInstruction('Blink to capture your photo');
    }
  };

  const cropToFace = async (photoUri: string, face: DetectedFace): Promise<string> => {
    try {
      // Add 30% padding around face
      const padding = 0.3;
      const x = Math.max(0, face.bounds.origin.x - face.bounds.size.width * padding);
      const y = Math.max(0, face.bounds.origin.y - face.bounds.size.height * padding);
      const width = face.bounds.size.width * (1 + 2 * padding);
      const height = face.bounds.size.height * (1 + 2 * padding);

      const manipResult = await ImageManipulator.manipulateAsync(
        photoUri,
        [
          {
            flip: ImageManipulator.FlipType.Horizontal, // Un-mirror the front camera photo
          },
          {
            crop: {
              originX: x,
              originY: y,
              width: Math.min(width, SCREEN_WIDTH - x),
              height: Math.min(height, SCREEN_HEIGHT - y),
            },
          },
          {
            resize: {
              width: 512, // Resize to consistent size
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
      console.error('Error cropping face:', error);
      // If cropping fails, return original
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
    setInstruction('Position your face in the frame');
    setFaceStatus('none');
    wasEyesClosedRef.current = false;
  };

  const getFaceOverlayColor = () => {
    switch (faceStatus) {
      case 'ready':
        return '#10b981'; // Green
      case 'detected':
        return '#f59e0b'; // Orange
      default:
        return '#ef4444'; // Red
    }
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
        // @ts-ignore - Face detection props might not be available in newer versions
        onFacesDetected={handleFacesDetected}
        faceDetectorSettings={{
          mode: FaceDetector.FaceDetectorMode.fast,
          detectLandmarks: FaceDetector.FaceDetectorLandmarks.all,
          runClassifications: FaceDetector.FaceDetectorClassifications.all,
          minDetectionInterval: 100,
          tracking: true,
        }}
      >
        {/* Face overlay */}
        {detectedFaces.length === 1 && (
          <View
            style={[
              styles.faceOverlay,
              {
                left: detectedFaces[0].bounds.origin.x,
                top: detectedFaces[0].bounds.origin.y,
                width: detectedFaces[0].bounds.size.width,
                height: detectedFaces[0].bounds.size.height,
                borderColor: getFaceOverlayColor(),
              },
            ]}
          />
        )}

        {/* Top instruction bar */}
        <View style={styles.topBar}>
          <View style={[styles.statusIndicator, { backgroundColor: getFaceOverlayColor() }]} />
          <Text style={styles.instructionText}>{instruction}</Text>
        </View>

        {/* Bottom controls */}
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.cancelButtonBottom} onPress={onCancel}>
            <Ionicons name="close" size={28} color="white" />
          </TouchableOpacity>

          <View style={styles.captureInfo}>
            <Text style={styles.captureInfoText}>
              {faceStatus === 'ready' ? 'Blink to capture' : 'Align your face'}
            </Text>
          </View>

          <View style={styles.placeholder} />
        </View>
      </CameraView>

      {isCapturing && (
        <View style={styles.capturingOverlay}>
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.capturingText}>Processing...</Text>
        </View>
      )}
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
  faceOverlay: {
    position: 'absolute',
    borderWidth: 3,
    borderRadius: 200,
    borderStyle: 'solid',
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  instructionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
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
  captureInfo: {
    flex: 1,
    alignItems: 'center',
  },
  captureInfoText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  placeholder: {
    width: 56,
  },
  capturingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  capturingText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
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
