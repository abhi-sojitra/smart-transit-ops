"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserAccountStatus = exports.ExpenseStatus = exports.MaintenanceStatus = exports.TripStatus = exports.LicenseStatus = exports.DriverStatus = exports.VehicleStatus = void 0;
var VehicleStatus;
(function (VehicleStatus) {
    VehicleStatus["AVAILABLE"] = "AVAILABLE";
    VehicleStatus["ON_TRIP"] = "ON_TRIP";
    VehicleStatus["MAINTENANCE"] = "MAINTENANCE";
    VehicleStatus["RETIRED"] = "RETIRED";
    VehicleStatus["ACTIVE"] = "ACTIVE";
    VehicleStatus["IN_SERVICE"] = "IN_SERVICE";
})(VehicleStatus || (exports.VehicleStatus = VehicleStatus = {}));
var DriverStatus;
(function (DriverStatus) {
    DriverStatus["AVAILABLE"] = "AVAILABLE";
    DriverStatus["ON_TRIP"] = "ON_TRIP";
    DriverStatus["SUSPENDED"] = "SUSPENDED";
    DriverStatus["OFF_DUTY"] = "OFF_DUTY";
})(DriverStatus || (exports.DriverStatus = DriverStatus = {}));
var LicenseStatus;
(function (LicenseStatus) {
    LicenseStatus["VALID"] = "VALID";
    LicenseStatus["EXPIRING"] = "EXPIRING";
    LicenseStatus["EXPIRED"] = "EXPIRED";
})(LicenseStatus || (exports.LicenseStatus = LicenseStatus = {}));
var TripStatus;
(function (TripStatus) {
    TripStatus["DRAFT"] = "DRAFT";
    TripStatus["DISPATCHED"] = "DISPATCHED";
    TripStatus["COMPLETED"] = "COMPLETED";
    TripStatus["CANCELLED"] = "CANCELLED";
})(TripStatus || (exports.TripStatus = TripStatus = {}));
var MaintenanceStatus;
(function (MaintenanceStatus) {
    MaintenanceStatus["SCHEDULED"] = "SCHEDULED";
    MaintenanceStatus["IN_PROGRESS"] = "IN_PROGRESS";
    MaintenanceStatus["COMPLETED"] = "COMPLETED";
})(MaintenanceStatus || (exports.MaintenanceStatus = MaintenanceStatus = {}));
var ExpenseStatus;
(function (ExpenseStatus) {
    ExpenseStatus["PENDING"] = "PENDING";
    ExpenseStatus["APPROVED"] = "APPROVED";
    ExpenseStatus["REJECTED"] = "REJECTED";
})(ExpenseStatus || (exports.ExpenseStatus = ExpenseStatus = {}));
var UserAccountStatus;
(function (UserAccountStatus) {
    UserAccountStatus["ACTIVE"] = "ACTIVE";
    UserAccountStatus["INACTIVE"] = "INACTIVE";
})(UserAccountStatus || (exports.UserAccountStatus = UserAccountStatus = {}));
//# sourceMappingURL=status.js.map