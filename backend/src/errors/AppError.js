export class AppError extends Error {
  constructor(code, httpStatus, message) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

function statusForUpstream(upstreamStatus) {
  // 401/403 means our key is wrong: a caller can't fix it, so don't advertise it.
  if (upstreamStatus === 401 || upstreamStatus === 403) return 500;
  if (upstreamStatus === 429) return 503;
  if (upstreamStatus === 504) return 504;
  return 502;
}

export class AzureMapsError extends AppError {
  constructor({ status, path, upstreamCode, upstreamMessage }) {
    super(
      'AZURE_MAPS_REQUEST_FAILED',
      statusForUpstream(status),
      `Azure Maps request to ${path} failed (upstream status ${status}).`,
    );
    this.name = 'AzureMapsError';
    this.upstreamStatus = status;
    this.upstreamCode = upstreamCode;
    this.upstreamMessage = upstreamMessage;
  }
}
