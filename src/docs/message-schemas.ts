/**
 * @swagger
 * components:
 *   schemas:
 *     Message:
 *       type: object
 *       required:
 *         - fromUserId
 *         - toUserId
 *         - message
 *       properties:
 *         id:
 *           type: string
 *           description: Unique message identifier
 *         fromUserId:
 *           type: string
 *           description: ID of the sender
 *         toUserId:
 *           type: string
 *           description: ID of the recipient
 *         message:
 *           type: string
 *           description: Message content
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: When the message was sent
 *         status:
 *           type: string
 *           enum: [pending, sent, delivered, read, error]
 *           description: Message delivery status
 *         isRead:
 *           type: boolean
 *           description: Whether the message has been read
 *         readAt:
 *           type: string
 *           format: date-time
 *           description: When the message was read
 *         attachments:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [image, document, location]
 *               url:
 *                 type: string
 *               name:
 *                 type: string
 *               size:
 *                 type: integer
 *
 *     Conversation:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique conversation identifier
 *         participant:
 *           $ref: '#/components/schemas/User'
 *         lastMessage:
 *           $ref: '#/components/schemas/Message'
 *         unreadCount:
 *           type: integer
 *           description: Number of unread messages
 *         isOnline:
 *           type: boolean
 *           description: Whether the other participant is online
 *         lastSeen:
 *           type: string
 *           format: date-time
 *           description: When the participant was last seen
 *
 *     MessageSendRequest:
 *       type: object
 *       required:
 *         - toUserId
 *         - message
 *       properties:
 *         toUserId:
 *           type: string
 *           description: ID of the recipient
 *         message:
 *           type: string
 *           description: Message content
 *         attachments:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [image, document, location]
 *               content:
 *                 type: string
 *                 format: binary
 *
 * /api/messages/conversations:
 *   get:
 *     summary: Get user conversations
 *     description: Retrieve all conversations for the current user
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *         description: Maximum number of conversations to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Number of conversations to skip
 *     responses:
 *       200:
 *         description: List of conversations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 conversations:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Conversation'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     hasMore:
 *                       type: boolean
 *
 * /api/messages/conversation/{userId}:
 *   get:
 *     summary: Get conversation messages
 *     description: Retrieve messages between current user and specified user
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the other user
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *         description: Maximum number of messages to return
 *       - in: query
 *         name: before
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Get messages before this timestamp
 *     responses:
 *       200:
 *         description: List of messages
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 messages:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Message'
 *                 hasMore:
 *                   type: boolean
 *                 participant:
 *                   $ref: '#/components/schemas/User'