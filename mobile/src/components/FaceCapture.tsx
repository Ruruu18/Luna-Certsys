import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { spacing, fontSize, moderateScale, verticalScale } from '../utils/responsive';

const { width, height } = Dimensions.get('window');

interface FaceCaptureProps {
  onCapture: (photoUri: string) => void;
  onCancel: () => void;
}

export default function FaceCapture({ onCapture, onCancel }: FaceCaptureProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showFlash, setShowFlash] = useState(false);
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [instruction, setInstruction] = useState('Position your face in the circle');
  const cameraRef = useRef<CameraView>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    console.log('FaceCapture mounted, permission:', permission);
    if (permission && !permission.granted) {
      console.log('Requesting camera permission...');
      requestPermission();
    }
  }, []);

  useEffect(() => {
    if (permission) {
      console.log('Camera permission status:', permission.granted);
    }
  }, [permission]);

  // Auto-start countdown when camera is ready
  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) {
        clearTimeout(countdownTimerRef.current);
      }
    };
  }, []);

  const startCountdown = () => {
    setCountdown(3);
    setInstruction('Get ready...');

    let count = 3;
    const interval = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdown(count);
        setInstruction(`Capturing in ${count}...`);
      } else {
        clearInterval(interval);
        setCountdown(null);
        handleAutoCapture();
      }
    }, 1000);
  };

  const handleAutoCapture = async () => {
    if (!cameraRef.current || isCapturing) return;

    setIsCapturing(true);
    setInstruction('Smile!');

    try {
      // Flash effect
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 200);

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        exif: false,
      });

      console.log('Photo captured:', photo.uri);

      // Flip the image horizontally to un-mirror the front camera
      const flippedPhoto = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ flip: ImageManipulator.FlipType.Horizontal }],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
      );

      setCapturedUri(flippedPhoto.uri);
      setInstruction('Photo captured! Review below');
      setIsCapturing(false);
    } catch (error) {
      console.error('Photo capture error:', error);
      Alert.alert('Capture Failed', 'Failed to capture photo. Please try again.');
      setIsCapturing(false);
      setCapturedUri(null);
      setInstruction('Position your face in the circle');
      // Restart countdown
      setTimeout(() => startCountdown(), 1000);
    }
  };

  const handleRetake = () => {
    setCapturedUri(null);
    setCountdown(null);
    setInstruction('Position your face in the circle');
    // Restart countdown after 2 seconds
    setTimeout(() => startCountdown(), 2000);
  };

  const handleConfirm = () => {
    if (capturedUri) {
      onCapture(capturedUri);
    }
  };

  if (!permission) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionDenied}>
        <Ionicons name="videocam-off-outline" size={moderateScale(64)} color={theme.colors.error} />
        <Text style={styles.permissionText}>Camera permission is required</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={requestPermission}
        >
          <Text style={styles.backButtonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.backButton, { marginTop: 10 }]} onPress={onCancel}>
          <Text style={styles.backButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  console.log('Rendering camera with permission:', permission?.granted);

  return (
    <View style={styles.container}>
      {/* Camera View */}
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="front"
        mode="picture"
        onCameraReady={() => {
          console.log('✅ Camera is ready!');
          setInstruction('Position your face in the circle');
          // Auto-start countdown after 1 second
          setTimeout(() => startCountdown(), 1000);
        }}
        onMountError={(error) => {
          console.error('❌ Camera mount error:', error);
          Alert.alert('Camera Error', 'Failed to start camera. Please try again.');
        }}
      >
        {/* Face Guide Overlay */}
        {!capturedUri && (
          <View style={styles.overlay}>
            {/* Top Instructions */}
            <View style={styles.instructionContainer}>
              <Ionicons name="information-circle" size={moderateScale(24)} color="white" />
              <Text style={styles.instructionText}>{instruction}</Text>
            </View>

            {/* Face Guide Circle */}
            <View style={styles.guideContainer}>
              <View style={styles.guideCircle}>
                <View style={styles.guideInnerCircle}>
                  {/* Countdown Number */}
                  {countdown !== null && (
                    <View style={styles.countdownContainer}>
                      <Text style={styles.countdownText}>{countdown}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Bottom Tips */}
            <View style={styles.tipsContainer}>
              <View style={styles.tip}>
                <Ionicons name="checkmark-circle" size={moderateScale(20)} color={theme.colors.success} />
                <Text style={styles.tipText}>Face the camera directly</Text>
              </View>
              <View style={styles.tip}>
                <Ionicons name="checkmark-circle" size={moderateScale(20)} color={theme.colors.success} />
                <Text style={styles.tipText}>Ensure good lighting</Text>
              </View>
              <View style={styles.tip}>
                <Ionicons name="checkmark-circle" size={moderateScale(20)} color={theme.colors.success} />
                <Text style={styles.tipText}>Remove sunglasses/mask</Text>
              </View>
            </View>

            {/* Cancel Button */}
            <View style={styles.controlsContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onCancel}
                disabled={isCapturing}
              >
                <Ionicons name="close-circle" size={moderateScale(32)} color="white" />
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Flash Effect Overlay */}
        {showFlash && <View style={styles.flashOverlay} />}
      </CameraView>

      {/* Photo Preview */}
      {capturedUri && (
        <View style={styles.previewContainer}>
          <Image source={{ uri: capturedUri }} style={styles.previewImage} />

          <View style={styles.previewOverlay}>
            <View style={styles.previewHeader}>
              <Ionicons name="checkmark-circle" size={moderateScale(48)} color={theme.colors.success} />
              <Text style={styles.previewTitle}>Photo Captured!</Text>
              <Text style={styles.previewSubtitle}>Does this look good?</Text>
            </View>

            <View style={styles.previewButtons}>
              <TouchableOpacity
                style={[styles.previewButton, styles.retakeButton]}
                onPress={handleRetake}
              >
                <Ionicons name="camera-reverse" size={moderateScale(24)} color={theme.colors.text} />
                <Text style={styles.retakeButtonText}>Retake</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.previewButton, styles.confirmButton]}
                onPress={handleConfirm}
              >
                <Ionicons name="checkmark" size={moderateScale(24)} color="white" />
                <Text style={styles.confirmButtonText}>Use Photo</Text>
              </TouchableOpacity>
            </View>
          </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: fontSize.md,
    color: theme.colors.textSecondary,
    fontFamily: theme.fontFamily.regular,
  },
  permissionDenied: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: spacing.xl,
  },
  permissionText: {
    marginTop: spacing.lg,
    fontSize: fontSize.lg,
    color: theme.colors.text,
    fontFamily: theme.fontFamily.medium,
    textAlign: 'center',
  },
  backButton: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: theme.colors.primary,
    borderRadius: moderateScale(8),
  },
  backButtonText: {
    color: 'white',
    fontSize: fontSize.md,
    fontFamily: theme.fontFamily.semiBold,
  },
  camera: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'space-between',
  },
  instructionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: verticalScale(60),
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  instructionText: {
    fontSize: fontSize.lg,
    fontFamily: theme.fontFamily.semiBold,
    color: 'white',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  guideContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideCircle: {
    width: moderateScale(280),
    height: moderateScale(280),
    borderRadius: moderateScale(140),
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  guideInnerCircle: {
    width: moderateScale(270),
    height: moderateScale(270),
    borderRadius: moderateScale(135),
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  tipsContainer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.xs,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  tipText: {
    fontSize: fontSize.sm,
    fontFamily: theme.fontFamily.regular,
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: verticalScale(40),
    paddingHorizontal: spacing.xl,
  },
  cancelButton: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  cancelText: {
    fontSize: fontSize.sm,
    fontFamily: theme.fontFamily.medium,
    color: 'white',
  },
  countdownContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownText: {
    fontSize: moderateScale(120),
    fontFamily: theme.fontFamily.bold,
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  flashOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'white',
    opacity: 0.9,
  },
  previewContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'black',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    transform: [{ scaleX: -1 }], // Flip horizontally to remove mirror effect
  },
  previewOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'space-between',
    paddingTop: verticalScale(80),
    paddingBottom: verticalScale(60),
  },
  previewHeader: {
    alignItems: 'center',
    gap: spacing.md,
  },
  previewTitle: {
    fontSize: fontSize.xxl,
    fontFamily: theme.fontFamily.bold,
    color: 'white',
    textAlign: 'center',
  },
  previewSubtitle: {
    fontSize: fontSize.lg,
    fontFamily: theme.fontFamily.regular,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  previewButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  previewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    borderRadius: moderateScale(12),
    gap: spacing.sm,
  },
  retakeButton: {
    backgroundColor: 'white',
  },
  retakeButtonText: {
    fontSize: fontSize.md,
    fontFamily: theme.fontFamily.semiBold,
    color: theme.colors.text,
  },
  confirmButton: {
    backgroundColor: theme.colors.primary,
  },
  confirmButtonText: {
    fontSize: fontSize.md,
    fontFamily: theme.fontFamily.semiBold,
    color: 'white',
  },
});
