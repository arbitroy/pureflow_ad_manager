'use client';

import { useCampaignForm } from '@/contexts/CampaignFormContext';

interface FormNavigationProps {
    showBack?: boolean;
    showNext?: boolean;
    showSubmit?: boolean;
    onCustomNext?: () => Promise<boolean>;
    submitLabel?: string;
}

const FormNavigation: React.FC<FormNavigationProps> = ({
    showBack = true,
    showNext = true,
    showSubmit = false,
    onCustomNext,
    submitLabel = 'Create Campaign'
}) => {
    const { prevStep, nextStep, submitForm, isSubmitting, currentStep, isEdit } = useCampaignForm();

    const handleNext = async () => {
        if (onCustomNext) {
            const canProceed = await onCustomNext();
            if (canProceed) {
                nextStep();
            }
        } else {
            nextStep();
        }
    };

    return (
        <div className="flex justify-between mt-8">
            {showBack && currentStep > 1 ? (
                <button
                    type="button"
                    onClick={prevStep}
                    className="px-4 py-2 bg-pure-dark text-white rounded-lg hover:bg-opacity-80 transition-colors"
                    disabled={isSubmitting}
                >
                    Back
                </button>
            ) : <div />}

            <div className="space-x-3">
                {showNext && (
                    <button
                        type="button"
                        onClick={handleNext}
                        className="px-4 py-2 bg-pure-primary text-white rounded-lg hover:bg-opacity-80 transition-colors"
                        disabled={isSubmitting}
                    >
                        Next
                    </button>
                )}

                {showSubmit && (
                    <button
                        type="button"
                        onClick={submitForm}
                        className="px-4 py-2 bg-pure-secondary text-white rounded-lg hover:bg-opacity-80 transition-colors"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <span className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Submitting...
                            </span>
                        ) : isEdit ? 'Update Campaign' : submitLabel}
                    </button>
                )}
            </div>
        </div>
    );
};

export default FormNavigation;