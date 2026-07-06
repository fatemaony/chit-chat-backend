export class HttpError extends Error {
    constructor(status, message, details) {
        super(message);
        this.status = status;
        this.details = details;
    }
}
export class NotFoundError extends HttpError {
    constructor(message = "Resource not found", details) {
        super(404, message, details);
    }
}
export class BadRequestError extends HttpError {
    constructor(message = "Bad request", details) {
        super(400, message, details);
    }
}
export class UnauthorizedError extends HttpError {
    constructor(message = "Unauthorized") {
        super(401, message);
    }
}
export class ForbiddenError extends HttpError {
    constructor(message = "Forbidden") {
        super(403, message);
    }
}
export class InternalServerError extends HttpError {
    constructor(message = "Internal server error", details) {
        super(500, message, details);
    }
}
