'use client';

import { useCampaignForm } from '@/contexts/CampaignFormContext';
import FormNavigation from '../FormNavigation';

const BasicDetailsStep: React.FC = () => {
    const { formState, setField, errors, isEdit } = useCampaignForm();

    return (
        <div className="card">
            <h2 className="text-xl font-bold mb-6">Campaign Details</h2>

            <div className="space-y-6">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-400 mb-2">
                        Campaign Name*
                    </label>
                    <input
                        id="name"
                        type="text"
                        value={formState.name}
                        onChange={(e) => setField('name', e.target.value)}
                        className="w-full bg-pure-dark text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-pure-primary"
                        placeholder="Enter campaign name"
                    />
                    {errors.name && (
                        <p className="mt-2 text-red-400 text-sm">{errors.name}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-400 mb-2">
                        Description
                    </label>
                    <textarea
                        id="description"
                        value={formState.description}
                        onChange={(e) => setField('description', e.target.value)}
                        className="w-full bg-pure-dark text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-pure-primary h-32 resize-none"
                        placeholder="Enter a detailed description of your campaign"
                    />
                </div>
                    
                <div>
                    <label htmlFor="budget" className="block text-sm font-medium text-gray-400 mb-2">
                        Budget ($)*
                    </label>
                    <input
                        id="budget"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formState.budget || ''}
                        onChange={(e) => setField('budget', parseFloat(e.target.value) || 0)}
                        className="w-full bg-pure-dark text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-pure-primary"
                        placeholder="Enter campaign budget"
                    />
                    {errors.budget && (
                        <p className="mt-2 text-red-400 text-sm">{errors.budget}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                        Set the total amount you want to spend on this campaign across all platforms.
                    </p>
                </div>
            </div>

            <FormNavigation showBack={false} />
        </div>
    );
};

export default BasicDetailsStep;