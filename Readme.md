# React Role Based Authentication System
        
Create a React authentication system that supports three user roles: User (shopper), Business Owner, and Admin. Implement registration and login forms where users select their role during signup. Use React Context or Redux for managing authentication state. The system should:

Allow users to register with email, password, and select their role.

Validate inputs and show appropriate error messages.

Allow users to login with email and password.

Store and manage authentication state globally.

After login, redirect users to role-specific dashboards (e.g., /user-dashboard, /business-dashboard, /admin-dashboard).

Include a logout feature.

Use React Router for navigation.


Made with Floot.

# Instructions

For security reasons, the `env.json` file is not pre-populated — you will need to generate or retrieve the values yourself.  

For **JWT secrets**, generate a value with:  

```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Then paste the generated value into the appropriate field.  

For the **Floot Database**, request a `pg_dump` from support, upload it to your own PostgreSQL database, and then fill in the connection string value.  

**Note:** Floot OAuth will not work in self-hosted environments.  

For other external services, retrieve your API keys and fill in the corresponding values.  

Once everything is configured, you can build and start the service with:  

```
npm install -g pnpm
pnpm install
pnpm vite build
pnpm tsx server.ts
```
