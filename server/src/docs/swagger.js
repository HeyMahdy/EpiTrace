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
 *     CreateWebhookRequest:
 *       type: object
 *       required: [provider, webhook_url]
 *       properties:
 *         provider:
 *           type: string
 *           enum: [slack, discord]
 *         webhook_url:
 *           type: string
 *           format: uri
 *     UpdateWebhookRequest:
 *       type: object
 *       properties:
 *         provider:
 *           type: string
 *           enum: [slack, discord]
 *         webhook_url:
 *           type: string
 *           format: uri
 *         is_active:
 *           type: boolean
 *     CreateGithubTokenRequest:
 *       type: object
 *       required: [access_token]
 *       properties:
 *         access_token:
 *           type: string
 *           description: GitHub personal access token
 *     UpdateGithubTokenRequest:
 *       type: object
 *       properties:
 *         access_token:
 *           type: string
 *           description: GitHub personal access token
 *         is_active:
 *           type: boolean
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
 * /dev/reset-db:
 *   get:
 *     tags: [Dev]
 *     summary: Reset database by truncating all public tables (no auth)
 *     description: Dangerous developer endpoint. Truncates all tables in public schema with RESTART IDENTITY CASCADE.
 *     responses:
 *       200:
 *         description: Database reset completed
 *       500:
 *         description: Failed to reset database
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

/**
 * @openapi
 * /webhook:
 *   post:
 *     tags: [Webhook]
 *     summary: Create a new webhook
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateWebhookRequest'
 *     responses:
 *       201:
 *         description: Webhook created
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Webhook already exists
 *       422:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 *   get:
 *     tags: [Webhook]
 *     summary: List all webhooks for authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Webhooks list
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

/**
 * @openapi
 * /webhook/{id}:
 *   get:
 *     tags: [Webhook]
 *     summary: Get webhook by ID
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
 *         description: Webhook details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Webhook not found
 *   patch:
 *     tags: [Webhook]
 *     summary: Update webhook
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
 *             $ref: '#/components/schemas/UpdateWebhookRequest'
 *     responses:
 *       200:
 *         description: Webhook updated
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Webhook not found
 *       422:
 *         description: Validation error
 *   delete:
 *     tags: [Webhook]
 *     summary: Delete webhook
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
 *         description: Webhook deleted
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Webhook not found
 */

/**
 * @openapi
 * /webhook/monitor/{monitorId}:
 *   get:
 *     tags: [Webhook]
 *     summary: Get all webhooks for a monitor
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: monitorId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Monitor webhooks list
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Monitor not found
 *       500:
 *         description: Internal server error
 */

/**
 * @openapi
 * /webhook/monitor/{monitorId}/add/{webhookId}:
 *   post:
 *     tags: [Webhook]
 *     summary: Add webhook to monitor
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: monitorId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: webhookId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Webhook added to monitor
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Monitor or webhook not found
 *       409:
 *         description: Webhook already associated
 *       500:
 *         description: Internal server error
 */

/**
 * @openapi
 * /webhook/monitor/{monitorId}/remove/{webhookId}:
 *   delete:
 *     tags: [Webhook]
 *     summary: Remove webhook from monitor
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: monitorId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: webhookId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Webhook removed from monitor
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Monitor, webhook, or association not found
 *       500:
 *         description: Internal server error
 */

/**
 * @openapi
 * /github-token:
 *   post:
 *     tags: [GithubToken]
 *     summary: Create a new GitHub access token
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateGithubTokenRequest'
 *     responses:
 *       201:
 *         description: GitHub token created
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Token already exists
 *       422:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 *   get:
 *     tags: [GithubToken]
 *     summary: List all GitHub tokens for authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: GitHub tokens list
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

/**
 * @openapi
 * /github-token/{id}:
 *   get:
 *     tags: [GithubToken]
 *     summary: Get GitHub token by ID
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
 *         description: GitHub token details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: GitHub token not found
 *   patch:
 *     tags: [GithubToken]
 *     summary: Update GitHub token
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
 *             $ref: '#/components/schemas/UpdateGithubTokenRequest'
 *     responses:
 *       200:
 *         description: GitHub token updated
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: GitHub token not found
 *       422:
 *         description: Validation error
 *   delete:
 *     tags: [GithubToken]
 *     summary: Delete GitHub token
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
 *         description: GitHub token deleted
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: GitHub token not found
 */

/**
 * @openapi
 * /github-token/monitor/{monitorId}:
 *   get:
 *     tags: [GithubToken]
 *     summary: Get GitHub tokens associated with a monitor
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: monitorId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Monitor GitHub tokens fetched
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Monitor not found
 *       500:
 *         description: Internal server error
 */

/**
 * @openapi
 * /github-token/monitor/{monitorId}/add/{tokenId}:
 *   post:
 *     tags: [GithubToken]
 *     summary: Add GitHub token to monitor
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: monitorId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: tokenId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: GitHub token added to monitor
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Monitor or GitHub token not found
 *       409:
 *         description: GitHub token already associated
 *       500:
 *         description: Internal server error
 */

/**
 * @openapi
 * /github-token/monitor/{monitorId}/remove/{tokenId}:
 *   delete:
 *     tags: [GithubToken]
 *     summary: Remove GitHub token from monitor
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: monitorId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: tokenId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: GitHub token removed from monitor
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Monitor, GitHub token, or association not found
 *       500:
 *         description: Internal server error
 */

export const swaggerDocsLoaded = true;
