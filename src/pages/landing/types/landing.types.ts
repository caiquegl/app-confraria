export type LandingViewProps = {
  onLogin?: () => void;
  onRegister?: () => void;
};

export type WelcomeModalProps = {
  visible: boolean;
  onContinue: () => void;
};

export type UseLandingResult = {
  modalVisible: boolean;
  isReady: boolean;
  handleModalContinue: () => void;
};
