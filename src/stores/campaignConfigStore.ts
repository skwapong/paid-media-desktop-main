/**
 * Campaign Config Store — Zustand store for the 4-step wizard.
 *
 * Manages wizard state, TDX segment fetching, step navigation,
 * and persistence via campaignConfigStorage.
 */

import { create } from 'zustand';
import type { CampaignBrief } from '../types/brief';
import type {
  CampaignConfig,
  CampaignSetupData,
  WizardStep,
  WizardSegment,
  ContentPage,
  ContentSpot,
  ContentVariant,
  VariantContent,
  SpotTargetingMode,
  ReviewStepData,
} from '../types/campaignConfig';
import { mapBriefToConfig } from '../services/briefToConfigMapper';
import { campaignConfigStorage, CURRENT_SCHEMA_VERSION } from '../services/campaignConfigStorage';
import { useSettingsStore } from './settingsStore';

interface ParentSegment {
  id: string;
  name: string;
  count: string | null;
  description: string;
}

interface CampaignConfigState {
  // Wizard state
  currentStep: WizardStep;
  config: CampaignConfig | null;
  isDirty: boolean;

  // TDX segment data
  parentSegments: ParentSegment[];
  childSegments: Array<{ id: string; name: string; count?: string; description?: string }>;
  isLoadingSegments: boolean;
  segmentError: string | null;

  // Actions — initialization
  initFromBrief: (brief: CampaignBrief) => Promise<void>;
  loadExistingConfig: (configId: string) => Promise<void>;
  reset: () => void;

  // Actions — TDX segments
  selectParentSegment: (id: string) => Promise<void>;

  // Actions — step navigation
  goToStep: (step: WizardStep) => void;
  goNext: () => void;
  goPrev: () => void;

  // Actions — Step 1
  updateSetup: (updates: Partial<CampaignSetupData>) => void;

  // Actions — Step 2
  toggleSegmentSelection: (segmentId: string) => void;
  confirmNewSegment: (segmentId: string) => void;

  // Actions — Step 3 (Content)
  updateSpotTargetingMode: (pageId: string, spotId: string, mode: SpotTargetingMode) => void;
  updateDefaultVariant: (pageId: string, spotId: string, updates: Partial<VariantContent>) => void;
  addVariant: (pageId: string, spotId: string, audienceName: string, audienceRefId: string) => void;
  removeVariant: (pageId: string, spotId: string, variantId: string) => void;
  updateVariantContent: (pageId: string, spotId: string, variantId: string, updates: Partial<VariantContent>) => void;
  updateVariantPriority: (pageId: string, spotId: string, variantId: string, priority: number) => void;
  setContentPages: (pages: ContentPage[]) => void;
  removeContentPage: (pageId: string) => void;
  removeContentSpot: (pageId: string, spotId: string) => void;

  // Actions — Step 4
  updateReview: (updates: Partial<ReviewStepData>) => void;

  // Actions — persistence
  saveAsDraft: () => void;
  launch: () => void;

  // Actions — AI skill output
  applySkillOutput: (step: WizardStep, data: unknown) => void;
}

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const EMPTY_VARIANT_CONTENT: VariantContent = {
  headline: '',
  body: '',
  ctaText: '',
  imageUrl: '',
  deepLinkUrl: '',
};

/** Deep-update a spot within the nested pages→spots structure */
function updateSpotInPages(
  pages: ContentPage[],
  pageId: string,
  spotId: string,
  updater: (spot: ContentSpot) => ContentSpot,
): ContentPage[] {
  return pages.map((page) => {
    if (page.pageId !== pageId) return page;
    return {
      ...page,
      spots: page.spots.map((spot) => {
        if (spot.spotId !== spotId) return spot;
        return updater(spot);
      }),
    };
  });
}

export const useCampaignConfigStore = create<CampaignConfigState>((set, get) => ({
  currentStep: 1,
  config: null,
  isDirty: false,
  parentSegments: [],
  childSegments: [],
  isLoadingSegments: false,
  segmentError: null,

  // ── Initialization ────────────────────────────────────────────────

  initFromBrief: async (brief: CampaignBrief) => {
    // Read parent segments from the shared settings store (populated by Layout)
    const settingsState = useSettingsStore.getState();
    const parentSegments = settingsState.parentSegments;
    const selectedParentId = settingsState.selectedParentSegmentId;

    // Map brief to config initially without child segments
    const config = mapBriefToConfig(brief, selectedParentId || undefined);

    set({
      config,
      currentStep: 1,
      isDirty: false,
      parentSegments,
      childSegments: [],
      isLoadingSegments: false,
      segmentError: null,
    });

    // If a parent segment is already selected in the global nav, auto-fetch children
    if (selectedParentId) {
      await get().selectParentSegment(selectedParentId);
    }
  },

  loadExistingConfig: async (configId: string) => {
    const config = campaignConfigStorage.getConfig(configId);
    if (!config) return;

    // Read parent segments from the shared settings store (same as initFromBrief)
    const settingsState = useSettingsStore.getState();
    const parentSegments = settingsState.parentSegments;

    set({
      config,
      currentStep: config.currentStep,
      isDirty: false,
      parentSegments,
      childSegments: [],
      isLoadingSegments: false,
      segmentError: null,
    });

    // Fetch child segments for the "Add More" picker in AudiencesStep,
    // but do NOT re-map or overwrite the saved audience selections.
    if (config.audiences.parentSegmentId) {
      try {
        const api = window.paidMediaSuite?.settings;
        if (api?.parentSegmentChildren) {
          set({ isLoadingSegments: true });
          const result = await api.parentSegmentChildren(config.audiences.parentSegmentId);
          if (result.success && result.data) {
            set({ childSegments: result.data, isLoadingSegments: false });
          } else {
            set({ isLoadingSegments: false, segmentError: result.error || null });
          }
        }
      } catch {
        set({ isLoadingSegments: false });
      }
    }
  },

  reset: () => {
    set({
      currentStep: 1,
      config: null,
      isDirty: false,
      parentSegments: [],
      childSegments: [],
      isLoadingSegments: false,
      segmentError: null,
    });
  },

  // ── TDX Segments ──────────────────────────────────────────────────

  selectParentSegment: async (parentId: string) => {
    const { config } = get();
    if (!config) return;

    set({ isLoadingSegments: true, segmentError: null });

    try {
      const api = window.paidMediaSuite?.settings;
      let childSegments: Array<{ id: string; name: string; count?: string; description?: string }> = [];

      if (api?.parentSegmentChildren) {
        const result = await api.parentSegmentChildren(parentId);
        if (result.success && result.data) {
          childSegments = result.data;
        } else if (result.error) {
          set({ segmentError: result.error, isLoadingSegments: false });
          return;
        }
      }

      // Re-map brief segments against the new child segments
      // Preserve existing selection state where possible
      const briefSegmentNames = config.audiences.segments
        .filter((s) => s.source === 'brief')
        .map((s) => s.name);

      const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
      const matchedBrief = new Set<string>();

      const newSegments: WizardSegment[] = [];

      for (const child of childSegments) {
        const matchedName = briefSegmentNames.find(
          (bs) => {
            const a = normalize(bs);
            const b = normalize(child.name);
            return a === b || b.includes(a) || a.includes(b);
          }
        );
        newSegments.push({
          id: child.id,
          name: child.name,
          parentSegmentId: parentId,
          count: child.count,
          description: child.description,
          isNew: false,
          isSelected: !!matchedName,
          source: 'tdx',
        });
        if (matchedName) matchedBrief.add(matchedName);
      }

      // Add unmatched brief segments as suggestions
      for (const seg of config.audiences.segments) {
        if (seg.source === 'brief' && !matchedBrief.has(seg.name)) {
          newSegments.push({
            ...seg,
            parentSegmentId: parentId,
          });
        }
      }

      set({
        childSegments,
        isLoadingSegments: false,
        config: {
          ...config,
          audiences: {
            parentSegmentId: parentId,
            segments: newSegments,
          },
          updatedAt: new Date().toISOString(),
        },
        isDirty: true,
      });
    } catch (err) {
      console.error('[CampaignConfigStore] Error fetching child segments:', err);
      set({
        isLoadingSegments: false,
        segmentError: 'Failed to fetch child segments. Check TDX CLI configuration.',
      });
    }
  },

  // ── Step Navigation ───────────────────────────────────────────────

  goToStep: (step: WizardStep) => {
    const { config } = get();
    if (config) {
      set({
        currentStep: step,
        config: { ...config, currentStep: step, updatedAt: new Date().toISOString() },
      });
    }
  },

  goNext: () => {
    const { currentStep } = get();
    if (currentStep < 4) {
      get().goToStep((currentStep + 1) as WizardStep);
    }
  },

  goPrev: () => {
    const { currentStep } = get();
    if (currentStep > 1) {
      get().goToStep((currentStep - 1) as WizardStep);
    }
  },

  // ── Step 1: Setup ─────────────────────────────────────────────────

  updateSetup: (updates: Partial<CampaignSetupData>) => {
    const { config } = get();
    if (!config) return;

    set({
      config: {
        ...config,
        setup: { ...config.setup, ...updates },
        updatedAt: new Date().toISOString(),
      },
      isDirty: true,
    });
  },

  // ── Step 2: Audiences ─────────────────────────────────────────────

  toggleSegmentSelection: (segmentId: string) => {
    const { config } = get();
    if (!config) return;

    const segments = config.audiences.segments.map((s) =>
      s.id === segmentId ? { ...s, isSelected: !s.isSelected } : s
    );

    set({
      config: {
        ...config,
        audiences: { ...config.audiences, segments },
        updatedAt: new Date().toISOString(),
      },
      isDirty: true,
    });
  },

  confirmNewSegment: (segmentId: string) => {
    const { config } = get();
    if (!config) return;

    const segments = config.audiences.segments.map((s) =>
      s.id === segmentId ? { ...s, isNew: false, isSelected: true } : s
    );

    set({
      config: {
        ...config,
        audiences: { ...config.audiences, segments },
        updatedAt: new Date().toISOString(),
      },
      isDirty: true,
    });
  },

  // ── Step 3: Content ───────────────────────────────────────────────

  setContentPages: (pages: ContentPage[]) => {
    const { config } = get();
    if (!config) return;

    set({
      config: {
        ...config,
        content: { pages },
        updatedAt: new Date().toISOString(),
      },
      isDirty: true,
    });
  },

  removeContentPage: (pageId: string) => {
    const { config } = get();
    if (!config) return;

    set({
      config: {
        ...config,
        content: { pages: config.content.pages.filter((p) => p.pageId !== pageId) },
        updatedAt: new Date().toISOString(),
      },
      isDirty: true,
    });
  },

  removeContentSpot: (pageId: string, spotId: string) => {
    const { config } = get();
    if (!config) return;

    const pages = config.content.pages.map((page) => {
      if (page.pageId !== pageId) return page;
      return { ...page, spots: page.spots.filter((s) => s.spotId !== spotId) };
    });

    set({
      config: { ...config, content: { pages }, updatedAt: new Date().toISOString() },
      isDirty: true,
    });
  },

  updateSpotTargetingMode: (pageId: string, spotId: string, mode: SpotTargetingMode) => {
    const { config } = get();
    if (!config) return;

    const pages = updateSpotInPages(config.content.pages, pageId, spotId, (spot) => ({
      ...spot,
      targetingMode: mode,
    }));

    set({
      config: { ...config, content: { pages }, updatedAt: new Date().toISOString() },
      isDirty: true,
    });
  },

  updateDefaultVariant: (pageId: string, spotId: string, updates: Partial<VariantContent>) => {
    const { config } = get();
    if (!config) return;

    const pages = updateSpotInPages(config.content.pages, pageId, spotId, (spot) => ({
      ...spot,
      defaultVariant: { ...spot.defaultVariant, ...updates },
    }));

    set({
      config: { ...config, content: { pages }, updatedAt: new Date().toISOString() },
      isDirty: true,
    });
  },

  addVariant: (pageId: string, spotId: string, audienceName: string, audienceRefId: string) => {
    const { config } = get();
    if (!config) return;

    const newVariant: ContentVariant = {
      variantId: makeId('var'),
      audienceType: 'segment',
      audienceName,
      audienceRefId,
      priority: 1,
      content: { ...EMPTY_VARIANT_CONTENT },
    };

    const pages = updateSpotInPages(config.content.pages, pageId, spotId, (spot) => ({
      ...spot,
      targetingMode: 'segment_variants' as const,
      variants: [...spot.variants, newVariant],
    }));

    set({
      config: { ...config, content: { pages }, updatedAt: new Date().toISOString() },
      isDirty: true,
    });
  },

  removeVariant: (pageId: string, spotId: string, variantId: string) => {
    const { config } = get();
    if (!config) return;

    const pages = updateSpotInPages(config.content.pages, pageId, spotId, (spot) => ({
      ...spot,
      variants: spot.variants.filter((v) => v.variantId !== variantId),
    }));

    set({
      config: { ...config, content: { pages }, updatedAt: new Date().toISOString() },
      isDirty: true,
    });
  },

  updateVariantContent: (pageId: string, spotId: string, variantId: string, updates: Partial<VariantContent>) => {
    const { config } = get();
    if (!config) return;

    const pages = updateSpotInPages(config.content.pages, pageId, spotId, (spot) => ({
      ...spot,
      variants: spot.variants.map((v) =>
        v.variantId === variantId ? { ...v, content: { ...v.content, ...updates } } : v
      ),
    }));

    set({
      config: { ...config, content: { pages }, updatedAt: new Date().toISOString() },
      isDirty: true,
    });
  },

  updateVariantPriority: (pageId: string, spotId: string, variantId: string, priority: number) => {
    const { config } = get();
    if (!config) return;

    const pages = updateSpotInPages(config.content.pages, pageId, spotId, (spot) => ({
      ...spot,
      variants: spot.variants.map((v) =>
        v.variantId === variantId ? { ...v, priority } : v
      ),
    }));

    set({
      config: { ...config, content: { pages }, updatedAt: new Date().toISOString() },
      isDirty: true,
    });
  },

  // ── Step 4: Review ────────────────────────────────────────────────

  updateReview: (updates: Partial<ReviewStepData>) => {
    const { config } = get();
    if (!config) return;

    set({
      config: {
        ...config,
        review: { ...config.review, ...updates },
        updatedAt: new Date().toISOString(),
      },
      isDirty: true,
    });
  },

  // ── Persistence ───────────────────────────────────────────────────

  saveAsDraft: () => {
    const { config } = get();
    if (!config) return;

    // Deep clone to avoid reference issues, ensure schema version is current
    const saved: CampaignConfig = JSON.parse(JSON.stringify({
      ...config,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      status: 'draft',
      updatedAt: new Date().toISOString(),
    }));
    campaignConfigStorage.saveConfig(saved);
    set({ config: saved, isDirty: false });
  },

  launch: () => {
    const { config } = get();
    if (!config) return;

    const launched: CampaignConfig = JSON.parse(JSON.stringify({
      ...config,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      status: 'launched',
      updatedAt: new Date().toISOString(),
    }));
    campaignConfigStorage.saveConfig(launched);
    set({ config: launched, isDirty: false });
  },

  // ── AI Skill Output ───────────────────────────────────────────────

  applySkillOutput: (step: WizardStep, data: unknown) => {
    const { config } = get();
    if (!config) return;

    switch (step) {
      case 1: {
        const setupUpdates = data as Partial<CampaignSetupData>;
        get().updateSetup(setupUpdates);
        break;
      }
      case 2: {
        const newSegments = data as WizardSegment[];
        const existingIds = new Set(config.audiences.segments.map((s) => s.id));
        const toAdd = newSegments.filter((s) => !existingIds.has(s.id));
        set({
          config: {
            ...config,
            audiences: {
              ...config.audiences,
              segments: [...config.audiences.segments, ...toAdd],
            },
            updatedAt: new Date().toISOString(),
          },
          isDirty: true,
        });
        break;
      }
      case 3: {
        // ContentPage[] — merge into existing content pages
        const incomingPages = data as ContentPage[];
        const existingPages = config.content.pages;

        // Merge by pageId: update existing pages, add new ones
        const mergedPages = [...existingPages];
        for (const incoming of incomingPages) {
          const existingIdx = mergedPages.findIndex((p) => p.pageId === incoming.pageId);
          if (existingIdx >= 0) {
            // Merge spots within the page
            const existingPage = mergedPages[existingIdx];
            const mergedSpots = [...existingPage.spots];
            for (const incomingSpot of incoming.spots) {
              const spotIdx = mergedSpots.findIndex((s) => s.spotId === incomingSpot.spotId);
              if (spotIdx >= 0) {
                // Update spot content but preserve user edits to default variant
                mergedSpots[spotIdx] = {
                  ...mergedSpots[spotIdx],
                  defaultVariant: incomingSpot.defaultVariant,
                  variants: incomingSpot.variants,
                  targetingMode: incomingSpot.targetingMode,
                };
              } else {
                mergedSpots.push(incomingSpot);
              }
            }
            mergedPages[existingIdx] = { ...existingPage, spots: mergedSpots };
          } else {
            mergedPages.push(incoming);
          }
        }

        set({
          config: {
            ...config,
            content: { pages: mergedPages },
            updatedAt: new Date().toISOString(),
          },
          isDirty: true,
        });
        break;
      }
      case 4:
        // Review suggestions are displayed, not auto-applied
        break;
    }
  },
}));
