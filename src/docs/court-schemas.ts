/**
 * @swagger
 * components:
 *   schemas:
 *     Court:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         id:
 *           type: string
 *           description: Auto-generated unique identifier
 *         name:
 *           type: string
 *           description: Name of the court
 *           example: "Court A"
 *         color:
 *           type: string
 *           description: Color identifier for the court
 *           example: "#1E90FF"
 *         openingHour:
 *           type: string
 *           format: HH:mm
 *           description: Court opening time (24h format)
 *           example: "08:00"
 *         closingHour:
 *           type: string
 *           format: HH:mm
 *           description: Court closing time (24h format)
 *           example: "22:00"
 *         isActive:
 *           type: boolean
 *           description: Whether the court is currently active
 *         maintenanceSchedule:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               reason:
 *                 type: string
 *           description: Scheduled maintenance periods
 *         features:
 *           type: array
 *           items:
 *             type: string
 *           description: Special features of the court
 *           example: ["lighting", "covered", "spectator-seating"]
 *         hourlyRate:
 *           type: object
 *           properties:
 *             standard:
 *               type: number
 *               description: Standard hourly rate
 *             peakHour:
 *               type: number
 *               description: Peak hour rate
 *           description: Pricing information
 *
 *     CourtAvailability:
 *       type: object
 *       properties:
 *         date:
 *           type: string
 *           format: date
 *           description: Date for availability
 *         timeSlots:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/TimeSlot'
 *         maintenanceScheduled:
 *           type: boolean
 *           description: Whether maintenance is scheduled for this date
 *         weather:
 *           type: object
 *           properties:
 *             condition:
 *               type: string
 *               description: Weather condition
 *             temperature:
 *               type: number
 *               description: Temperature in Celsius
 *             precipitation:
 *               type: number
 *               description: Precipitation probability
 *           description: Weather forecast (for outdoor courts)
 *
 * /api/courts/{id}/availability:
 *   get:
 *     summary: Get court availability
 *     description: Get detailed availability information for a specific court
 *     tags: [Courts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Court ID
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Date to check availability (YYYY-MM-DD)
 *       - in: query
 *         name: includeWeather
 *         schema:
 *           type: boolean
 *         description: Include weather forecast for outdoor courts
 *     responses:
 *       200:
 *         description: Court availability information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CourtAvailability'
 *       404:
 *         description: Court not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotFoundError'
 *       422:
 *         description: Invalid date format or range
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ValidationError'
 *                 - example:
 *                     status: 422
 *                     message: Invalid date. Date must be within the next 30 days
 *                     code: INVALID_DATE_RANGE
 */