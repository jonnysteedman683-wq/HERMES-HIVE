import { ResourceMarketListing } from '../../shared/types';
import { hiveRegistry } from '../federation/hiveRegistry';

export class ResourceMarket {
  private listings: Map<string, ResourceMarketListing> = new Map();

  constructor() {
    this.seedMarketListings();
  }

  private seedMarketListings(): void {
    const hives = hiveRegistry.getAllHives();

    for (const h of hives) {
      const hiveId = h.identity.hiveId;
      const hiveName = h.identity.name;
      const rep = h.reputationScore || 80;

      this.listings.set(`list-${hiveId}-token`, {
        listingId: `list-${hiveId}-token`,
        hiveId: hiveId,
        hiveName: hiveName,
        resourceType: 'TOKEN_BUDGET',
        availableQuantity: 500000,
        unitCostTokens: 1,
        estimatedLatencyMs: 150,
        reputationScore: rep,
      });

      this.listings.set(`list-${hiveId}-agent`, {
        listingId: `list-${hiveId}-agent`,
        hiveId: hiveId,
        hiveName: hiveName,
        resourceType: 'AGENT_CAPACITY',
        availableQuantity: 10,
        unitCostTokens: 1200,
        estimatedLatencyMs: 300,
        reputationScore: rep,
      });
    }
  }

  public getAllListings(): ResourceMarketListing[] {
    return Array.from(this.listings.values());
  }

  public getListingsByType(type: ResourceMarketListing['resourceType']): ResourceMarketListing[] {
    return this.getAllListings().filter(l => l.resourceType === type);
  }

  public addListing(listing: ResourceMarketListing): void {
    this.listings.set(listing.listingId, listing);
  }
}

export const resourceMarket = new ResourceMarket();
