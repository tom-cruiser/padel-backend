/**
 * @swagger
 * components:
 *   schemas:
 *     TimeSlot:
 *       type: object
 *       properties:
 *         startTime:
 *           type: string
 *           format: HH:mm
 *           description: Start time of the slot
 *         endTime:
 *           type: string
 *           format: HH:mm
 *           description: End time of the slot
 *         isAvailable:
 *           type: boolean
 *           description: Whether the slot is available for booking
 *         price:
 *           type: number
 *           description: Price for this time slot
 *         peakHour:
 *           type: boolean
 *           description: Whether this is a peak hour slot
 *
 *     BookingCreate:
 *       type: object
 *       required:
 *         - courtId
 *         - date
 *         - startTime
 *       properties:
 *         courtId:
 *           type: string
 *           description: ID of the court to book
 *         date:
 *           type: string
 *           format: date
 *           description: Date of the booking (YYYY-MM-DD)
 *         startTime:
 *           type: string
 *           format: HH:mm
 *           description: Start time of the booking
 *         isRecurring:
 *           type: boolean
 *           description: Whether this is a recurring booking
 *         recurringPattern:
 *           type: object
 *           properties:
 *             type:
 *               type: string
 *               enum: [weekly, monthly]
 *               description: Type of recurrence
 *             endDate:
 *               type: string
 *               format: date
 *               description: End date for recurring bookings
 *             daysOfWeek:
 *               type: array
 *               items:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 6
 *               description: Days of week for weekly recurrence (0 = Sunday)
 *
 *     Booking:
 *       allOf:
 *         - $ref: '#/components/schemas/BookingCreate'
 *         - type: object
 *           properties:
 *             id:
 *               type: string
 *               description: Unique booking identifier
 *             userId:
 *               type: string
 *               description: ID of the user who made the booking
 *             status:
 *               type: string
 *               enum: [confirmed, pending, cancelled]
 *               description: Current status of the booking
 *             createdAt:
 *               type: string
 *               format: date-time
 *               description: When the booking was created
 *             updatedAt:
 *               type: string
 *               format: date-time
 *               description: When the booking was last updated
 *             court:
 *               $ref: '#/components/schemas/Court'
 *             user:
 *               $ref: '#/components/schemas/User'
 *             price:
 *               type: number
 *               description: Total price for the booking
 *             cancelledAt:
 *               type: string
 *               format: date-time
 *               description: When the booking was cancelled (if applicable)
 *             cancellationReason:
 *               type: string
 *               description: Reason for cancellation (if applicable)
 *
 *     BookingList:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Booking'
 *         pagination:
 *           type: object
 *           properties:
 *             total:
 *               type: integer
 *               description: Total number of bookings
 *             page:
 *               type: integer
 *               description: Current page number
 *             limit:
 *               type: integer
 *               description: Number of items per page
 *             totalPages:
 *               type: integer
 *               description: Total number of pages
 */

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     summary: Create a new booking
 *     description: Create a new court booking with optional recurring pattern
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BookingCreate'
 *     responses:
 *       201:
 *         description: Booking created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booking'
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthenticationError'
 *       409:
 *         description: Time slot already booked
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ConflictError'
 *                 - example:
 *                     status: 409
 *                     message: Time slot is already booked
 *                     code: SLOT_UNAVAILABLE
 *                     data:
 *                       nextAvailableSlot:
 *                         date: "2025-10-30"
 *                         startTime: "11:00"
 *       422:
 *         description: Business rule violation
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Error'
 *                 - example:
 *                     status: 422
 *                     message: Cannot book outside court hours
 *                     code: INVALID_BOOKING_TIME
 */