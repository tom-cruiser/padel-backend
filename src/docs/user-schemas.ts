/**
 * @swagger
 * components:
 *   schemas:
 *     UserBase:
 *       type: object
 *       required:
 *         - email
 *         - firstName
 *         - lastName
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *           example: "john.doe@example.com"
 *         firstName:
 *           type: string
 *           description: User's first name
 *           example: "John"
 *         lastName:
 *           type: string
 *           description: User's last name
 *           example: "Doe"
 *         language:
 *           type: string
 *           enum: [en, fr]
 *           description: User's preferred language
 *           example: "en"
 *         avatar:
 *           type: string
 *           format: uri
 *           description: URL to user's avatar image
 *         phoneNumber:
 *           type: string
 *           description: User's phone number
 *           example: "+1234567890"
 *         notificationPreferences:
 *           type: object
 *           properties:
 *             email:
 *               type: boolean
 *               description: Email notifications enabled
 *             sms:
 *               type: boolean
 *               description: SMS notifications enabled
 *             inApp:
 *               type: boolean
 *               description: In-app notifications enabled
 *
 *     UserCreate:
 *       allOf:
 *         - $ref: '#/components/schemas/UserBase'
 *         - type: object
 *           required:
 *             - password
 *           properties:
 *             password:
 *               type: string
 *               format: password
 *               minLength: 8
 *               description: User's password (min 8 characters)
 *
 *     User:
 *       allOf:
 *         - $ref: '#/components/schemas/UserBase'
 *         - type: object
 *           properties:
 *             id:
 *               type: string
 *               description: Unique user identifier
 *             role:
 *               type: string
 *               enum: [player, admin]
 *               description: User's role in the system
 *             createdAt:
 *               type: string
 *               format: date-time
 *               description: When the user account was created
 *             lastSeen:
 *               type: string
 *               format: date-time
 *               description: When the user was last active
 *             isOnline:
 *               type: boolean
 *               description: Whether the user is currently online
 *             status:
 *               type: string
 *               enum: [active, suspended, pending]
 *               description: Account status
 *             stats:
 *               type: object
 *               properties:
 *                 totalBookings:
 *                   type: integer
 *                   description: Total number of bookings made
 *                 cancelledBookings:
 *                   type: integer
 *                   description: Number of cancelled bookings
 *                 favoriteCourtId:
 *                   type: string
 *                   description: ID of the most booked court
 *                 preferredPlayTime:
 *                   type: string
 *                   description: Most frequent booking time
 *
 *     UserProfile:
 *       allOf:
 *         - $ref: '#/components/schemas/User'
 *         - type: object
 *           properties:
 *             upcomingBookings:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Booking'
 *             recentActivity:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [booking, cancellation, message]
 *                   timestamp:
 *                     type: string
 *                     format: date-time
 *                   details:
 *                     type: object
 *
 *     UserUpdateRequest:
 *       type: object
 *       properties:
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         language:
 *           type: string
 *           enum: [en, fr]
 *         avatar:
 *           type: string
 *         phoneNumber:
 *           type: string
 *         notificationPreferences:
 *           type: object
 *           properties:
 *             email:
 *               type: boolean
 *             sms:
 *               type: boolean
 *             inApp:
 *               type: boolean
 *
 *     UserPasswordChange:
 *       type: object
 *       required:
 *         - currentPassword
 *         - newPassword
 *       properties:
 *         currentPassword:
 *           type: string
 *           format: password
 *         newPassword:
 *           type: string
 *           format: password
 *           minLength: 8
 *
 * /api/users/{id}:
 *   get:
 *     summary: Get user profile
 *     description: Retrieve detailed user profile information
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotFoundError'
 *   patch:
 *     summary: Update user profile
 *     description: Update user profile information
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserUpdateRequest'
 *     responses:
 *       200:
 *         description: User profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       403:
 *         description: Not authorized to update this user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthorizationError'
 */