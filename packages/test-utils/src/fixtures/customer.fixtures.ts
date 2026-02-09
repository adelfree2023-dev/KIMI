/**
 * Customer Mock Data Fixtures
 *
 * Factory functions to generate customer test data.
 *
 * @module @apex/test-utils/fixtures/customer
 */

import type { Customer } from '@apex/validators';
import { faker } from '@faker-js/faker';

/**
 * Creates a mock customer
 */
export function createMockCustomer(overrides?: Partial<Customer>): Customer {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();

  return {
    id: faker.string.uuid(),
    email: faker.internet.email({ firstName, lastName }).toLowerCase(),
    firstName,
    lastName,
    phone: faker.phone.number(),
    avatarUrl: faker.image.avatar(),
    loyaltyPoints: faker.number.int({ min: 0, max: 5000 }),
    walletBalance: faker.number.float({ min: 0, max: 500, precision: 0.01 }),
    orderCount: faker.number.int({ min: 0, max: 50 }),
    totalSpent: faker.number.float({ min: 0, max: 10000, precision: 0.01 }),
    createdAt: faker.date.past({ years: 2 }).toISOString(),
    ...overrides,
  };
}

/**
 * Creates a VIP customer (high lifetime value)
 */
export function createVIPCustomer(): Customer {
  return createMockCustomer({
    loyaltyPoints: faker.number.int({ min: 5000, max: 20000 }),
    orderCount: faker.number.int({ min: 50, max: 200 }),
    totalSpent: faker.number.float({ min: 10000, max: 50000, precision: 0.01 }),
  });
}

/**
 * Creates a new customer
 */
export function createNewCustomer(): Customer {
  return createMockCustomer({
    loyaltyPoints: 0,
    orderCount: 0,
    totalSpent: 0,
    createdAt: faker.date.recent({ days: 7 }).toISOString(),
  });
}
