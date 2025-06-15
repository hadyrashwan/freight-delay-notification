import { ActivityDependencies } from '../lib/utils';

const TRAFFIC_API_URL = 'https://routes.googleapis.com/directions/v2:computeRoutes';
type GoogleRoutesResponse = {
  routes: {
    duration: string;
    staticDuration: string;
  }[];
};

export interface GoogleMapsClient {
  getTrafficDelay(originAddress: string, destinationAddress: string, options?: {
    waypoints?: string[];
    departureTimeISO?: string;
  }): Promise<number>;
}

export class GoogleMapsClientImpl implements GoogleMapsClient {
  private readonly apiKey: string;
  private readonly deps: ActivityDependencies;

  constructor(apiKey: string, deps: ActivityDependencies = new ActivityDependencies()) {
    this.apiKey = apiKey;
    this.deps = deps;
  }

  async getTrafficDelay(originAddress: string, destinationAddress: string, options?: {
    waypoints?: string[];
    departureTimeISO?: string;
  }): Promise<number> {
    const intermediates = [];
    if (options && options.waypoints && options.waypoints.length > 0) {
      const waypoints = options.waypoints.map(address => ({ address }));
      intermediates.push(...waypoints);
    }

    const headers = {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': this.apiKey,
      'X-Goog-FieldMask': 'routes.duration,routes.staticDuration',
    };

    const body = {
      origin: { address: originAddress },
      destination: { address: destinationAddress },
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_AWARE',
      intermediates,
      departureTime: options?.departureTimeISO,
    };

    const httpResponse = await fetch(TRAFFIC_API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const responseBody = (await httpResponse.json()) as GoogleRoutesResponse;
    this.deps.logger.log('Traffic API response', { responseBody });

    if (!httpResponse.ok) {
      throw this.deps.applicationError.create('Request to traffic api failed', 'API_FAILED', true);
    }

    const route = responseBody.routes[0];
    const durationWithTrafficSec = parseInt(route.duration.slice(0, -1), 10);
    const staticDurationSec = parseInt(route.staticDuration.slice(0, -1), 10);
    const trafficDelayInSeconds = Math.round(durationWithTrafficSec - staticDurationSec);
    this.deps.logger.log('Traffic delay calculated', {
      durationWithTrafficSec,
      staticDurationSec,
      trafficDelayInSeconds,
    });

    return trafficDelayInSeconds;
  }
}
