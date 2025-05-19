'use client';

import { useCampaignForm } from '@/contexts/CampaignFormContext';
import { motion } from 'framer-motion';

const FormProgressIndicator: React.FC = () => {
    const { currentStep, goToStep, validateStep, totalSteps, isEdit } = useCampaignForm();

    const steps = [
        { number: 1, title: 'Basic Details' },
        { number: 2, title: 'Platforms' },
        { number: 3, title: 'Scheduling' },
        { number: 4, title: 'Geo-Targeting' },
        { number: 5, title: 'Preview' }
    ];

    const handleStepClick = (stepNumber: number) => {
        // Only allow going to previous steps or current step
        if (stepNumber <= currentStep) {
            goToStep(stepNumber);
        } else {
            // Try to validate current step before proceeding
            if (validateStep(currentStep)) {
                goToStep(stepNumber);
            }
        }
    };

    return (
        <div className="pt-6">
            <div className="flex items-center justify-between">
                {steps.map((step, index) => (
                    <div key={step.number} className="flex flex-col items-center">
                        <button
                            className={`relative h-10 w-10 rounded-full flex items-center justify-center text-white 
                ${currentStep >= step.number ? 'bg-pure-primary' : 'bg-pure-dark'}`}
                            onClick={() => handleStepClick(step.number)}
                        >
                            {step.number}

                            {/* Connector line */}
                            {index < steps.length - 1 && (
                                <div className="absolute left-full h-0.5 w-full bg-pure-dark -z-10">
                                    <motion.div
                                        className="h-full bg-pure-primary origin-left"
                                        initial={{ scaleX: 0 }}
                                        animate={{
                                            scaleX: currentStep > step.number ? 1 : 0
                                        }}
                                        transition={{ duration: 0.3 }}
                                    />
                                </div>
                            )}
                        </button>
                        <span
                            className={`mt-2 text-xs ${currentStep >= step.number ? 'text-pure-primary' : 'text-gray-400'
                                }`}
                        >
                            {step.title}
                        </span>
                    </div>
                ))}
            </div>

            <div className="mt-6 h-1 bg-pure-dark rounded-full overflow-hidden">
                <motion.div
                    className="h-full bg-pure-primary origin-left"
                    initial={{ scaleX: 0 }}
                    animate={{
                        scaleX: currentStep / totalSteps
                    }}
                    transition={{ duration: 0.3 }}
                />
            </div>
        </div>
    );
};

export default FormProgressIndicator;