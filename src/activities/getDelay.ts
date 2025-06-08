import { ApplicationFailure } from "@temporalio/activity";
import { ERRORS } from "./types";

const TRAFFIC_API_URL = 'https://routes.googleapis.com/directions/v2:computeRoutes';
type GoogleRoutesResponse = {
  routes: {
    duration: string;
    staticDuration: string;
  }[];
};


export async function getDelay(originAddress: string, destinationAddress: string, options?: {
  waypoints?: string[];
  departureTimeISO?: string;
}): Promise<{
  trafficDelayInSeconds: number;
}> {

  // Environment variables can be moved to be loaded at the worker level and injected to the activity
  const apiKey = process.env.TRAFFIC_API_KEY;

  if (!apiKey) {
    // ApplicationFailure can be abstracted away to reduce coupling.
    throw new ApplicationFailure('Missing the API Key configuration.', ERRORS.MISSING_ENVIRONMENT_VARIABLE);
  }

  // Google api specific logic can be abstracted away to reduce coupling.
  const intermediates = [];
  if (options && options.waypoints && options.waypoints.length > 0) {
    const waypoints = options.waypoints.map(address => ({ address }));
    intermediates.push(...waypoints);
  }

  const headers = {
    'Content-Type': 'application/json',
    'X-Goog-Api-Key': apiKey,
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

  const responseBody = await httpResponse.json() as GoogleRoutesResponse;
  console.log('Traffic API response', responseBody);

  if (!httpResponse.ok) {
    throw new ApplicationFailure('Request to traffic api failed', ERRORS.API_FAILED, null, [responseBody, { status: httpResponse.status }]);
  }

  const route = responseBody.routes[0];
  const durationWithTrafficSec = parseInt(route.duration.slice(0, -1), 10);
  const staticDurationSec = parseInt(route.staticDuration.slice(0, -1), 10);
  const trafficDelayInSeconds = Math.round((durationWithTrafficSec - staticDurationSec));
  console.log({ durationWithTrafficSec, staticDurationSec, trafficDelayInSeconds });

  return {
    trafficDelayInSeconds,
  };
}
