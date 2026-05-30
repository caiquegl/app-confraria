import { useWizard } from "../business/useWizard";
import { PreparingProfile } from "../components/PreparingProfile";
import { Step1 } from "../components/steps/Step1";
import { Step2 } from "../components/steps/Step2";
import { Step3 } from "../components/steps/Step3";
import { Step4 } from "../components/steps/Step4";
import { Step5 } from "../components/steps/Step5";

export function WizardView() {
  const {
    currentStep,
    formData,
    goBack,
    goNext,
    isPreparingProfile,
    onPreparingComplete,
    userName,
  } = useWizard();

  const stepProps = {
    defaultValues: formData,
    isPreparingProfile,
    onBack: goBack,
    onNext: goNext,
  };

  const step = (() => {
    switch (currentStep) {
      case 1:
        return <Step1 {...stepProps} />;
      case 2:
        return <Step2 {...stepProps} />;
      case 3:
        return <Step3 {...stepProps} />;
      case 4:
        return <Step4 {...stepProps} />;
      case 5:
        return <Step5 {...stepProps} />;
      default:
        return <Step1 {...stepProps} />;
    }
  })();

  return (
    <>
      {step}
      <PreparingProfile
        visible={isPreparingProfile}
        userName={userName}
        onComplete={onPreparingComplete}
      />
    </>
  );
}
