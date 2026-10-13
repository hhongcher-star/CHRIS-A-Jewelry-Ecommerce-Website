# Postman API test

1. Keep the local database and API running:

   ```powershell
   cd backend
   npm run db:local:start
   npm run dev
   ```

2. In Postman, select **Import**, then import
   `CHRISEA-Jewelry.postman_collection.json`.
3. Open the collection and run requests in numbered order.
4. Postman automatically retains the HTTP-only refresh cookie and the collection
   test scripts automatically update `accessToken`.

The first Register request creates `postman.test@chrisea.local`. Repeating it
correctly returns HTTP 409. After the first run, use Login to repeat the remaining
authentication flow, or change the `testEmail` collection variable.
