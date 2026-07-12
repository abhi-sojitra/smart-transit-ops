import { DriverStatus, LicenseCategory, BloodGroup } from '@transitops/shared-types';

const FIRST_NAMES = [
  'Maya', 'Jordan', 'Sam', 'Priya', 'Alex', 'Nina', 'Omar', 'Elena',
  'Kai', 'Sofia', 'Dev', 'Aisha', 'Leo', 'Mei', 'Raj', 'Chloe',
  'Noah', 'Zara', 'Ethan', 'Lila',
];

const LAST_NAMES = [
  'Chen', 'Lee', 'Okonkwo', 'Sharma', 'Nguyen', 'Patel', 'Hassan', 'Rossi',
  'Tanaka', 'Garcia', 'Singh', 'Khan', 'Martinez', 'Wong', 'Iyer', 'Brooks',
  'Kim', 'Ali', 'Park', 'Fernandez',
];

const CITIES = [
  { city: 'Bengaluru', state: 'Karnataka' },
  { city: 'Mumbai', state: 'Maharashtra' },
  { city: 'Delhi', state: 'Delhi' },
  { city: 'Hyderabad', state: 'Telangana' },
  { city: 'Chennai', state: 'Tamil Nadu' },
];

const STATUSES = [
  DriverStatus.AVAILABLE,
  DriverStatus.ON_TRIP,
  DriverStatus.OFF_DUTY,
  DriverStatus.SUSPENDED,
  DriverStatus.AVAILABLE,
];

const CATEGORIES = [
  LicenseCategory.CDL_A,
  LicenseCategory.CDL_B,
  LicenseCategory.HMV,
  LicenseCategory.LMV,
];

const BLOOD_GROUPS = [
  BloodGroup.O_POSITIVE,
  BloodGroup.A_POSITIVE,
  BloodGroup.B_POSITIVE,
  BloodGroup.AB_POSITIVE,
  BloodGroup.O_NEGATIVE,
];

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d;
}

export function buildDemoDrivers(count = 20) {
  return Array.from({ length: count }, (_, index) => {
    const firstName = FIRST_NAMES[index % FIRST_NAMES.length];
    const lastName = LAST_NAMES[index % LAST_NAMES.length];
    const location = CITIES[index % CITIES.length];
    const status = STATUSES[index % STATUSES.length];
    const code = `EMP-${1001 + index}`;
    const phone = `+91987654${String(1000 + index).slice(-4)}`;

    // Mix of valid, expiring, and (for suspended) near-expired licenses
    let licenseExpiryDate = daysFromNow(365 + index * 30);
    if (index % 7 === 0) licenseExpiryDate = daysFromNow(15); // expiring soon
    if (status === DriverStatus.SUSPENDED && index % 2 === 0) {
      licenseExpiryDate = daysFromNow(200);
    }

    return {
      employeeCode: code,
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index}@demo.transitops.com`,
      phone,
      alternatePhone: `+91981234${String(2000 + index).slice(-4)}`,
      dateOfBirth: new Date(1985 + (index % 15), index % 12, (index % 27) + 1),
      joiningDate: new Date(2018 + (index % 6), index % 12, 1),
      licenseNumber: `DL-${String(10 + (index % 30)).padStart(2, '0')}-2020-${String(1000000 + index)}`,
      licenseCategory: CATEGORIES[index % CATEGORIES.length],
      licenseIssueDate: new Date(2019, index % 12, 10),
      licenseExpiryDate,
      experienceYears: 2 + (index % 18),
      address: `${10 + index} Fleet Avenue`,
      city: location.city,
      state: location.state,
      country: 'India',
      postalCode: String(560001 + index),
      emergencyName: `${LAST_NAMES[(index + 3) % LAST_NAMES.length]} Contact`,
      emergencyPhone: `+91970000${String(3000 + index).slice(-4)}`,
      bloodGroup: BLOOD_GROUPS[index % BLOOD_GROUPS.length],
      photo: undefined,
      documents: [],
      status,
      safetyScore: 65 + ((index * 7) % 36),
      remarks: index % 3 === 0 ? 'Demo seed driver' : undefined,
      isDeleted: false,
      createdBy: 'seed',
    };
  });
}
