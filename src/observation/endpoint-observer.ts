/**
 * Endpoint observer
 * Aggregates observations at endpoint level
 */

import { TrafficSample, EndpointObservation, HttpMethod, ObservationWindow } from '../types.js';
import { FieldObserver } from './field-observer.js';

/**
 * Builds endpoint observation from traffic samples for a single endpoint
 */
export function buildEndpointObservation(
    method: HttpMethod,
    path: string,
    samples: TrafficSample[],
    window: ObservationWindow
): EndpointObservation {
    const requestObserver = new FieldObserver();
    const responseObserver = new FieldObserver();
    const statusCodes: Record<number, number> = {};

    for (const sample of samples) {
        // Observe request body
        requestObserver.observeBody(sample.requestBody);

        // Observe response body
        responseObserver.observeBody(sample.responseBody);

        // Track status codes
        statusCodes[sample.statusCode] = (statusCodes[sample.statusCode] || 0) + 1;
    }

    return {
        method,
        path,
        window,
        responseFields: responseObserver.getObservations(),
        requestFields: requestObserver.getObservations(),
        statusCodes,
    };
}
