/**
 * @openapi
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *     RegisterRequest:
 *       type: object
 *       required: [email, password, rePassword]
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           minLength: 6
 *         rePassword:
 *           type: string
 *           minLength: 6
 *     LoginRequest:
 *       type: object
 *       required: [email, password]
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *     CreateMonitorRequest:
 *       type: object
 *       required: [name, url, repo_link, method, check_interval, timeout]
 *       properties:
 *         name:
 *           type: string
 *         url:
 *           type: string
 *           format: uri
 *         repo_link:
 *           type: string
 *           format: uri
 *         method:
 *           type: string
 *           enum: [GET, POST, PUT, DELETE, PATCH]
 *         request_header:
 *           type: object
 *           additionalProperties: true
 *         request_body:
 *           type: object
 *           additionalProperties: true
 *         is_active:
 *           type: boolean
 *         check_interval:
 *           type: integer
 *           minimum: 10
 *         timeout:
 *           type: integer
 *           minimum: 1
 *     UpdateMonitorRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         url:
 *           type: string
 *           format: uri
 *         repo_link:
 *           type: string
 *           format: uri
 *         method:
 *           type: string
 *           enum: [GET, POST, PUT, DELETE, PATCH]
 *         request_header:
 *           type: object
 *           additionalProperties: true
 *         request_body:
 *           type: object
 *           additionalProperties: true
 *         check_interval:
 *           type: integer
 *           minimum: 10
 *         timeout:
 *           type: integer
 *           minimum: 1
 */

/**
 * @openapi
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Service and database health check
 *     responses:
 *       200:
 *         description: Service is healthy
 *       500:
 *         description: Database connection failed
 */

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation failure
 *       409:
 *         description: Email already exists
 *       500:
 *         description: Internal server error
 */

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Validation failure
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Internal server error
 */

/**
 * @openapi
 * /monitor/create:
 *   post:
 *     tags: [Monitor]
 *     summary: Create a monitor
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateMonitorRequest'
 *     responses:
 *       201:
 *         description: Monitor created
 *       401:
 *         description: Missing or invalid token
 *       422:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */

/**
 * @openapi
 * /monitor:
 *   get:
 *     tags: [Monitor]
 *     summary: List monitors for authenticated user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Monitor list
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

/**
 * @openapi
 * /monitor/{id}:
 *   get:
 *     tags: [Monitor]
 *     summary: Get monitor by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Monitor details
 *       404:
 *         description: Monitor not found
 *   patch:
 *     tags: [Monitor]
 *     summary: Update monitor by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateMonitorRequest'
 *     responses:
 *       200:
 *         description: Monitor updated
 *       404:
 *         description: Monitor not found
 *       422:
 *         description: Validation error
 *   delete:
 *     tags: [Monitor]
 *     summary: Delete monitor by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Monitor deleted
 *       404:
 *         description: Monitor not found
 */

/**
 * @openapi
 * /monitor/start/{id}:
 *   post:
 *     tags: [Monitor]
 *     summary: Start monitor
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Monitor started
 * /monitor/pause/{id}:
 *   post:
 *     tags: [Monitor]
 *     summary: Pause monitor
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Monitor paused
 * /monitor/resume/{id}:
 *   post:
 *     tags: [Monitor]
 *     summary: Resume monitor
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Monitor resumed
 */

/**
 * @openapi
 * /monitor/{id}/history:
 *   get:
 *     tags: [Monitor]
 *     summary: Get monitor execution history
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: History list
 *       404:
 *         description: Monitor not found
 */

export const swaggerDocsLoaded = true;
