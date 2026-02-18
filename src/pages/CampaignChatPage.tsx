/**
 * Campaign Chat Page -- Route-level wrapper that checks for a brief query param.
 * If no brief is present, renders the CampaignLandingPage instead of the chat.
 */

import { useSearchParams } from 'react-router-dom';
import CampaignChatPageComponent from '../components/campaign/CampaignChatPage';
import CampaignLandingPage from '../components/campaign/CampaignLandingPage';

export default function CampaignChatPage() {
  const [searchParams] = useSearchParams();
  const hasBrief = searchParams.has('brief');
  const hasBlueprintId = searchParams.has('blueprintId');
  const hasSessionId = searchParams.has('sessionId');

  // Show the landing page when there is no brief, blueprint, or session to load
  if (!hasBrief && !hasBlueprintId && !hasSessionId) {
    return <CampaignLandingPage />;
  }

  return <CampaignChatPageComponent />;
}
