import { GoogleMapsClient } from "./googleMapsClient";

export function createGetDelay(googleMapsClient: GoogleMapsClient) {
  return async function getDelay(originAddress: string, destinationAddress: string, options?: {
    waypoints?: string[];
    departureTimeISO?: string;
  }): Promise<{
    trafficDelayInSeconds: number;
  }> {
    const trafficDelayInSeconds = await googleMapsClient.getTrafficDelay(originAddress, destinationAddress, options);

    return {
      trafficDelayInSeconds,
    };
  }
}
