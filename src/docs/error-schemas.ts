/**
 * @swagger
 * components:
 *   schemas:
 *     Error:
 *       type: object
 *       required:
 *         - status
 *         - message
 *       properties:
 *         status:
 *           type: integer
 *           description: HTTP status code
 *         message:
 *           type: string
 *           description: Error message
 *         errors:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               field:
 *                 type: string
 *                 description: The field that caused the error
 *               message:
 *                 type: string
 *                 description: Specific error message for this field
 *           description: Detailed validation errors if applicable
 *         code:
 *           type: string
 *           description: Error code for client-side error handling
 *       example:
 *         status: 400
 *         message: Validation error
 *         code: VALIDATION_ERROR
 *         errors:
 *           - field: email
 *             message: Must be a valid email address
 *           - field: password
 *             message: Password must be at least 8 characters
 *     ValidationError:
 *       allOf:
 *         - $ref: '#/components/schemas/Error'
 *       example:
 *         status: 400
 *         message: Validation failed
 *         code: VALIDATION_ERROR
 *         errors:
 *           - field: startTime
 *             message: Must be a valid time in HH:mm format
 *     AuthenticationError:
 *       allOf:
 *         - $ref: '#/components/schemas/Error'
 *       example:
 *         status: 401
 *         message: Authentication failed
 *         code: AUTH_ERROR
 *     AuthorizationError:
 *       allOf:
 *         - $ref: '#/components/schemas/Error'
 *       example:
 *         status: 403
 *         message: Insufficient permissions
 *         code: FORBIDDEN
 *     NotFoundError:
 *       allOf:
 *         - $ref: '#/components/schemas/Error'
 *       example:
 *         status: 404
 *         message: Resource not found
 *         code: NOT_FOUND
 *     ConflictError:
 *       allOf:
 *         - $ref: '#/components/schemas/Error'
 *       example:
 *         status: 409
 *         message: Resource already exists
 *         code: CONFLICT
 */