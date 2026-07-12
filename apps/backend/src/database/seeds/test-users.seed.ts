export const TEST_USERS = [
  {
    email: 'fleet@transitops.com',
    password: 'Fleet@12345',
    firstName: 'Fleet',
    lastName: 'Manager',
    role: 'FLEET_MANAGER' as const,
  },
  {
    email: 'finance@transitops.com',
    password: 'Finance@12345',
    firstName: 'Financial',
    lastName: 'Analyst',
    role: 'FINANCIAL_ANALYST' as const,
  },
  {
    email: 'driver@transitops.com',
    password: 'Driver@12345',
    firstName: 'John',
    lastName: 'Driver',
    role: 'OPERATOR' as const,
  },
  {
    email: 'safety@transitops.com',
    password: 'Safety@12345',
    firstName: 'Safety',
    lastName: 'Officer',
    role: 'SAFETY_OFFICER' as const,
  },
] as const;
