'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CampaignFormProvider, CampaignFormState, useCampaignForm } from '@/contexts/CampaignFormContext';
import FormProgressIndicator from './FormProgressIndicator';
import BasicDetailsStep from './steps/BasicDetailsStep';
import PlatformsStep from './steps/PlatformsStep';
import SchedulingStep from './steps/SchedulingStep';
import GeoTargetingStep from './steps/GeoTargetingStep';
import PreviewStep from './steps/PreviewStep';

interface CampaignFormProps {
    initialData?: Partial<CampaignFormState>;
    onSubmit: (data: CampaignFormState) => Promise<void>;
}

const CampaignForm: React.FC<CampaignFormProps> = ({ initialData, onSubmit }) => {
    return (
        <CampaignFormProvider initialData={initialData} onSubmit={onSubmit}>
            <div className="max-w-4xl mx-auto">
                <FormProgressIndicator />

                <div className="mt-8">
                    <StepRenderer />
                </div>
            </div>
        </CampaignFormProvider>
    );
};

// Component to render the current step
const StepRenderer: React.FC = () => {
    const { currentStep } = useCampaignForm();

    // Animation variants for step transitions
    const variants = {
        enter: { opacity: 0, x: 50 },
        center: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -50 }
    };

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={currentStep}
                initial="enter"
                animate="center"
                exit="exit"
                variants={variants}
                transition={{ duration: 0.3 }}
            >
                {currentStep === 1 && <BasicDetailsStep />}
                {currentStep === 2 && <PlatformsStep />}
                {currentStep === 3 && <SchedulingStep />}
                {currentStep === 4 && <GeoTargetingStep />}
                {currentStep === 5 && <PreviewStep />}
            </motion.div>
        </AnimatePresence>
    );
};

export default CampaignForm;
