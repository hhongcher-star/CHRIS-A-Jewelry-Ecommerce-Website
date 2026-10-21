# Security Policy and Implementation Checklist

## Secrets

- Keep passwords, API credentials and JWT/session secrets in `.env` or the hosting environment.
- Commit only `.env.example`, with empty or non-sensitive sample values.
- Use separate development and production credentials.
- Rotate any secret immediately if it is accidentally committed or exposed.
- Never commit database exports. Keep local backups in the ignored `private-backups/` folder or secure private storage. Removing a dump in a later commit does not erase earlier Git history; coordinate history cleanup and credential rotation if it was shared.

## Authentication and Authorization

- Hash passwords with Argon2id or bcrypt using an appropriate cost.
- Apply secure, HTTP-only and same-site cookie settings when cookies are used.
- Enforce authorization on the server for every customer and admin resource.
- Never trust a role, price, discount, stock value or order total sent by the browser.
- Apply login rate limits and temporary lockouts for repeated failures.
- Require a stronger authentication policy for administrators.

## Manual Payment Safety

- A screenshot or receipt upload is not proof of settled funds.
- New orders begin as `pending_payment`.
- Uploaded proof changes the order only to `pending_verification`.
- Only an authorized administrator may confirm payment after checking the receiving account.
- Store payment reference, reviewer, review time and notes in the audit trail.
- Do not expose bank details beyond what is required for payment.

## File Uploads

- Accept only explicitly allowed image/PDF MIME types and extensions.
- Verify file signatures; do not rely only on the filename or request header.
- Enforce a maximum size and generate random server-side filenames.
- Store payment proofs outside the public web root or in private object storage.
- Serve proofs only through an authenticated, authorized endpoint.
- Disable script execution in every upload directory.
- Consider malware scanning before making an upload available to staff.

## API and Database

- Validate and normalize every request on the server.
- Use parameterized queries or a properly configured ORM.
- Apply rate limits to authentication, contact, review and upload endpoints.
- Configure CORS with the exact production frontend origin.
- Return generic client errors and keep detailed errors in protected logs.
- Use a restricted database account rather than a root account.
- Encrypt traffic with HTTPS in development integrations and production.

## Customer Data

- Collect only data required to fulfil orders and provide support.
- Define retention periods for accounts, orders, addresses and payment proofs.
- Avoid recording passwords, tokens, full payment details or proof URLs in logs.
- Limit staff access according to their role.
- Provide a process for customer data access, correction and deletion requests.

## Frontend

- Escape or sanitize user-generated content before rendering.
- Do not use `dangerouslySetInnerHTML` with untrusted content.
- Keep authentication tokens out of `localStorage` when secure cookie sessions are available.
- Set appropriate Content Security Policy after production domains are known.
- Do not expose environment secrets through frontend build variables.

## Operations

- Keep Node.js and dependencies updated and review dependency alerts.
- Back up the database and private uploads on a defined schedule.
- Test restoration rather than assuming backups work.
- Record administrative actions and important order-state changes.
- Monitor repeated failed logins, upload abuse and unusual order activity.
- Prepare an incident-response contact and credential-rotation procedure.

## Reporting a Security Issue

Do not disclose vulnerabilities through public issues. Send a private report to the project owner with reproduction steps, affected endpoint, impact and suggested mitigation. Add the final security contact before launch.

