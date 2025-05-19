'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { Campaign, CampaignStatus, Platform, GeoZone } from '@/types/models';

// Form state interface
export interface CampaignFormState {
    id?: string;
    name: string;
    description: string;
    budget: number;
    platforms: Platform[];
    startDate?: Date | null;
    endDate?: Date | null;
    geoZones: GeoZone[];
    status: CampaignStatus;
}

// Form context interface
interface CampaignFormContextType {
    formState: CampaignFormState;
    currentStep: number;
    totalSteps: number;
    isSubmitting: boolean;
    isEdit: boolean;
    errors: Record<string, string>;
    setField: (field: keyof CampaignFormState, value: any) => void;
    nextStep: () => void;
    prevStep: () => void;
    goToStep: (step: number) => void;
    submitForm: () => Promise<void>;
    validateStep: (step: number) => boolean;
    setErrors: (errors: Record<string, string>) => void;
}

// Default form state
const defaultFormState: CampaignFormState = {
    name: '',
    description: '',
    budget: 0,
    platforms: [],
    startDate: null,
    endDate: null,
    geoZones: [],
    status: CampaignStatus.DRAFT
};

// Create context
const CampaignFormContext = createContext<CampaignFormContextType | undefined>(undefined);

// Provider props
interface CampaignFormProviderProps {
    children: ReactNode;
    initialData?: Partial<CampaignFormState>;
    onSubmit: (data: CampaignFormState) => Promise<void>;
}

// Provider component
export const CampaignFormProvider: React.FC<CampaignFormProviderProps> = ({
    children,
    initialData,
    onSubmit
}) => {
    const [formState, setFormState] = useState<CampaignFormState>({
        ...defaultFormState,
        ...initialData
    });
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const totalSteps = 5;

    const isEdit = !!initialData?.id;

    // Set individual field
    const setField = (field: keyof CampaignFormState, value: any) => {
        setFormState(prev => ({ ...prev, [field]: value }));

        // Clear error when field is updated
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    // Navigate to next step
    const nextStep = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, totalSteps));
        }
    };

    // Navigate to previous step
    const prevStep = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    // Go to specific step
    const goToStep = (step: number) => {
        if (step < currentStep || validateStep(currentStep)) {
            setCurrentStep(Math.min(Math.max(step, 1), totalSteps));
        }
    };

    // Form validation by step
    const validateStep = (step: number): boolean => {
        const newErrors: Record<string, string> = {};

        switch (step) {
            case 1: // Basic details validation
                if (!formState.name.trim()) newErrors.name = 'Campaign name is required';
                if (formState.budget <= 0) newErrors.budget = 'Budget must be greater than 0';
                break;
            case 2: // Platform validation
                if (formState.platforms.length === 0)
                    newErrors.platforms = 'At least one platform must be selected';
                break;
            case 3: // Scheduling validation
                if (formState.startDate && formState.endDate) {
                    if (new Date(formState.startDate) > new Date(formState.endDate)) {
                        newErrors.dateRange = 'End date must be after start date';
                    }
                }
                break;
            case 4: // Geo-targeting validation is optional
                break;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Submit form
    const submitForm = async () => {
        // Validate current step
        if (!validateStep(currentStep)) {
            return;
        }

        setIsSubmitting(true);

        try {
            await onSubmit(formState);
        } catch (error) {
            console.error('Error submitting form:', error);
            setErrors({ submit: 'Failed to submit form. Please try again.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <CampaignFormContext.Provider
            value={{
                formState,
                currentStep,
                totalSteps,
                isSubmitting,
                isEdit,
                errors,
                setField,
                nextStep,
                prevStep,
                goToStep,
                submitForm,
                validateStep,
                setErrors
            }}
        >
            {children}
        </CampaignFormContext.Provider>
    );
};

// Hook for using the campaign form context
export const useCampaignForm = (): CampaignFormContextType => {
    const context = useContext(CampaignFormContext);
    if (!context) {
        throw new Error('useCampaignForm must be used within a CampaignFormProvider');
    }
    return context;
};