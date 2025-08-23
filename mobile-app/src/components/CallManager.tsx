import React, { useState, useEffect } from 'react';
import { Modal, Alert } from 'react-native';
import IncomingCallScreen from '../screens/IncomingCallScreen';
import CallService from '../services/CallService';
import { useNavigation } from '@react-navigation/native';

interface CallManagerProps {
  children: React.ReactNode;
}

export const CallManager: React.FC<CallManagerProps> = ({ children }) => {
  const [showIncomingCall, setShowIncomingCall] = useState(false);
  const [callConfig, setCallConfig] = useState<any>(null);
  const navigation = useNavigation();

  // Simulate an incoming call (for demo purposes)
  useEffect(() => {
    // Simulate a call after 10 seconds for demo
    const timer = setTimeout(() => {
      triggerIncomingCall();
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  const triggerIncomingCall = () => {
    const config = {
      callerName: 'AI Financial Advisor',
      callerNumber: 'Personal Finance Assistant',
      callType: 'video' as const,
    };

    CallService.startIncomingCall(config);
    setCallConfig(config);
    setShowIncomingCall(true);
  };

  const handleAccept = async () => {
    await CallService.answerCall();
    setShowIncomingCall(false);
    
    // Navigate to voice call screen
    navigation.navigate('VoiceCall' as never);
  };

  const handleDecline = async () => {
    await CallService.declineCall();
    setShowIncomingCall(false);
  };

  const handleMessage = () => {
    setShowIncomingCall(false);
    CallService.declineCall();
    navigation.navigate('Chat' as never);
  };

  const handleRemind = () => {
    setShowIncomingCall(false);
    CallService.declineCall();
    Alert.alert(
      'Reminder Set',
      'We\'ll remind you about this call in 1 hour',
      [{ text: 'OK' }]
    );
  };

  return (
    <>
      {children}
      <Modal
        visible={showIncomingCall}
        animationType="slide"
        presentationStyle="fullScreen"
        statusBarTranslucent
      >
        <IncomingCallScreen
          callerName={callConfig?.callerName}
          callerNumber={callConfig?.callerNumber}
          callerImage={callConfig?.callerImage}
          onAccept={handleAccept}
          onDecline={handleDecline}
          onMessage={handleMessage}
          onRemind={handleRemind}
        />
      </Modal>
    </>
  );
};

// Hook to trigger calls programmatically
export const useCallManager = () => {
  const triggerCall = (config: {
    callerName: string;
    callerNumber?: string;
    callerImage?: string;
  }) => {
    // This would be called from anywhere in the app
    CallService.startIncomingCall({
      ...config,
      callType: 'video',
    });
  };

  return { triggerCall };
};