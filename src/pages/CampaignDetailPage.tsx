import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCampaignConfigStore } from '../stores/campaignConfigStore';
import CampaignConfigurationWizard from '../components/CampaignConfigurationWizard';

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [notFound, setNotFound] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setNotFound(true);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      await useCampaignConfigStore.getState().loadExistingConfig(id);
      if (cancelled) return;

      const loaded = useCampaignConfigStore.getState().config;
      if (!loaded) {
        setNotFound(true);
      }
      setIsLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleComplete = () => {
    useCampaignConfigStore.getState().reset();
    navigate('/campaigns');
  };

  const handleCancel = () => {
    // Auto-save as draft so work is not lost
    const store = useCampaignConfigStore.getState();
    if (store.config) {
      store.saveAsDraft();
    }
    store.reset();
    navigate('/campaigns');
  };

  if (isLoading) {
    return (
      <div className="h-full p-6">
        <div className="h-full bg-white rounded-2xl shadow-sm overflow-hidden flex items-center justify-center">
          <div className="text-center">
            <div className="relative mb-4 mx-auto w-12 h-12">
              <div className="w-12 h-12 rounded-full border-4 border-gray-200 animate-pulse" />
              <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-transparent border-t-black animate-spin" />
            </div>
            <p className="text-sm text-gray-500">Loading campaign...</p>
          </div>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="h-full p-6">
        <div className="h-full bg-white rounded-2xl shadow-sm overflow-hidden flex items-center justify-center">
          <div className="text-center px-6">
            <svg className="w-16 h-16 text-gray-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-lg font-medium text-gray-900 mb-1">Campaign not found</h2>
            <p className="text-sm text-gray-500 mb-6">
              This campaign may have been deleted or the link is invalid.
            </p>
            <button
              onClick={() => navigate('/campaigns')}
              className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              Back to Campaigns
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full p-6">
      <div className="h-full bg-white rounded-2xl shadow-sm overflow-hidden">
        <CampaignConfigurationWizard
          onComplete={handleComplete}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
