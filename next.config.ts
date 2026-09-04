import type { NextConfig } from "next";
const config: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
  async redirects() {
    return [
      {
        source: "/index.php",
        destination: "/",
        permanent: false,
      },
      {
        source: "/healthcare_system/index.php",
        destination: "/",
        permanent: false,
      },
      {
        source: "/login.php",
        destination: "/login",
        permanent: false,
      },
      {
        source: "/healthcare_system/login.php",
        destination: "/login",
        permanent: false,
      },
      {
        source: "/login.html",
        destination: "/login",
        permanent: false,
      },
      {
        source: "/healthcare_system/login.html",
        destination: "/login",
        permanent: false,
      },
      {
        source: "/register.php",
        destination: "/register",
        permanent: false,
      },
      {
        source: "/healthcare_system/register.php",
        destination: "/register",
        permanent: false,
      },
      {
        source: "/register.html",
        destination: "/register",
        permanent: false,
      },
      {
        source: "/healthcare_system/register.html",
        destination: "/register",
        permanent: false,
      },
      {
        source: "/logout.php",
        destination: "/logout",
        permanent: false,
      },
      {
        source: "/healthcare_system/logout.php",
        destination: "/logout",
        permanent: false,
      },
      {
        source: "/details.php",
        destination: "/medicines",
        permanent: false,
      },
      {
        source: "/healthcare_system/details.php",
        destination: "/medicines",
        permanent: false,
      },
      {
        source: "/doctor_search/index.php",
        destination: "/doctors",
        permanent: false,
      },
      {
        source: "/healthcare_system/doctor_search/index.php",
        destination: "/doctors",
        permanent: false,
      },
      {
        source: "/doctor_search",
        destination: "/doctors",
        permanent: false,
      },
      {
        source: "/healthcare_system/doctor_search",
        destination: "/doctors",
        permanent: false,
      },
      {
        source: "/medicine_search/index.php",
        destination: "/medicines",
        permanent: false,
      },
      {
        source: "/healthcare_system/medicine_search/index.php",
        destination: "/medicines",
        permanent: false,
      },
      {
        source: "/medicine_search",
        destination: "/medicines",
        permanent: false,
      },
      {
        source: "/healthcare_system/medicine_search",
        destination: "/medicines",
        permanent: false,
      },
      {
        source: "/doctor/dashboard.php",
        destination: "/doctor",
        permanent: false,
      },
      {
        source: "/healthcare_system/doctor/dashboard.php",
        destination: "/doctor",
        permanent: false,
      },
      {
        source: "/admin/login.html",
        destination: "/login",
        permanent: false,
      },
      {
        source: "/healthcare_system/admin/login.html",
        destination: "/login",
        permanent: false,
      },
      {
        source: "/admin/login.php",
        destination: "/login",
        permanent: false,
      },
      {
        source: "/healthcare_system/admin/login.php",
        destination: "/login",
        permanent: false,
      },
      {
        source: "/admin/login_process.php",
        destination: "/login",
        permanent: false,
      },
      {
        source: "/healthcare_system/admin/login_process.php",
        destination: "/login",
        permanent: false,
      },
      {
        source: "/admin/logout.php",
        destination: "/logout",
        permanent: false,
      },
      {
        source: "/healthcare_system/admin/logout.php",
        destination: "/logout",
        permanent: false,
      },
      {
        source: "/admin/dashboard.php",
        destination: "/admin",
        permanent: false,
      },
      {
        source: "/healthcare_system/admin/dashboard.php",
        destination: "/admin",
        permanent: false,
      },
      {
        source: "/admin/ambulance.php",
        destination: "/admin/ambulances",
        permanent: false,
      },
      {
        source: "/healthcare_system/admin/ambulance.php",
        destination: "/admin/ambulances",
        permanent: false,
      },
      {
        source: "/about.php",
        destination: "/about",
        permanent: false,
      },
      {
        source: "/healthcare_system/about.php",
        destination: "/about",
        permanent: false,
      },
      {
        source: "/appointments.php",
        destination: "/appointments",
        permanent: false,
      },
      {
        source: "/healthcare_system/appointments.php",
        destination: "/appointments",
        permanent: false,
      },
      {
        source: "/medicines.php",
        destination: "/medicines",
        permanent: false,
      },
      {
        source: "/healthcare_system/medicines.php",
        destination: "/medicines",
        permanent: false,
      },
      {
        source: "/hospitals.php",
        destination: "/hospitals",
        permanent: false,
      },
      {
        source: "/healthcare_system/hospitals.php",
        destination: "/hospitals",
        permanent: false,
      },
      {
        source: "/health-records.php",
        destination: "/health-records",
        permanent: false,
      },
      {
        source: "/healthcare_system/health-records.php",
        destination: "/health-records",
        permanent: false,
      },
      {
        source: "/emergency.php",
        destination: "/emergency",
        permanent: false,
      },
      {
        source: "/healthcare_system/emergency.php",
        destination: "/emergency",
        permanent: false,
      },
      {
        source: "/doctor-portal.php",
        destination: "/doctor-portal",
        permanent: false,
      },
      {
        source: "/healthcare_system/doctor-portal.php",
        destination: "/doctor-portal",
        permanent: false,
      },
      {
        source: "/caregivers.php",
        destination: "/caregivers",
        permanent: false,
      },
      {
        source: "/healthcare_system/caregivers.php",
        destination: "/caregivers",
        permanent: false,
      },
      {
        source: "/admin/doctors.php",
        destination: "/admin/doctors",
        permanent: false,
      },
      {
        source: "/healthcare_system/admin/doctors.php",
        destination: "/admin/doctors",
        permanent: false,
      },
      {
        source: "/admin/users.php",
        destination: "/admin/users",
        permanent: false,
      },
      {
        source: "/healthcare_system/admin/users.php",
        destination: "/admin/users",
        permanent: false,
      },
      {
        source: "/admin/caregivers.php",
        destination: "/admin/caregivers",
        permanent: false,
      },
      {
        source: "/healthcare_system/admin/caregivers.php",
        destination: "/admin/caregivers",
        permanent: false,
      },
      {
        source: "/admin/hospitals.php",
        destination: "/admin/hospitals",
        permanent: false,
      },
      {
        source: "/healthcare_system/admin/hospitals.php",
        destination: "/admin/hospitals",
        permanent: false,
      },
      {
        source: "/admin/lab_tests.php",
        destination: "/admin/lab_tests",
        permanent: false,
      },
      {
        source: "/healthcare_system/admin/lab_tests.php",
        destination: "/admin/lab_tests",
        permanent: false,
      },
      {
        source: "/admin/symptom_rules.php",
        destination: "/admin/symptom_rules",
        permanent: false,
      },
      {
        source: "/healthcare_system/admin/symptom_rules.php",
        destination: "/admin/symptom_rules",
        permanent: false,
      },
      {
        source: "/admin/lab_tests.html",
        destination: "/admin/lab_tests",
        permanent: false,
      },
      {
        source: "/healthcare_system/admin/lab_tests.html",
        destination: "/admin/lab_tests",
        permanent: false,
      },
      {
        source: "/patient/prescriptions.php",
        destination: "/patient/prescriptions",
        permanent: false,
      },
      {
        source: "/healthcare_system/patient/prescriptions.php",
        destination: "/patient/prescriptions",
        permanent: false,
      },
      {
        source: "/patient/reports.php",
        destination: "/patient/reports",
        permanent: false,
      },
      {
        source: "/healthcare_system/patient/reports.php",
        destination: "/patient/reports",
        permanent: false,
      },
      {
        source: "/patient/profile.php",
        destination: "/patient/profile",
        permanent: false,
      },
      {
        source: "/healthcare_system/patient/profile.php",
        destination: "/patient/profile",
        permanent: false,
      },
      {
        source: "/patient/caregivers.php",
        destination: "/patient/caregivers",
        permanent: false,
      },
      {
        source: "/healthcare_system/patient/caregivers.php",
        destination: "/patient/caregivers",
        permanent: false,
      },
      {
        source: "/patient/hospitals.php",
        destination: "/patient/hospitals",
        permanent: false,
      },
      {
        source: "/healthcare_system/patient/hospitals.php",
        destination: "/patient/hospitals",
        permanent: false,
      },
      {
        source: "/patient/ambulances.php",
        destination: "/patient/ambulances",
        permanent: false,
      },
      {
        source: "/healthcare_system/patient/ambulances.php",
        destination: "/patient/ambulances",
        permanent: false,
      },
      {
        source: "/patient/lab_tests.php",
        destination: "/patient/lab_tests",
        permanent: false,
      },
      {
        source: "/healthcare_system/patient/lab_tests.php",
        destination: "/patient/lab_tests",
        permanent: false,
      },
      {
        source: "/patient/search.php",
        destination: "/patient/search",
        permanent: false,
      },
      {
        source: "/healthcare_system/patient/search.php",
        destination: "/patient/search",
        permanent: false,
      },
      {
        source: "/patient/dashboard.php",
        destination: "/patient",
        permanent: false,
      },
      {
        source: "/healthcare_system/patient/dashboard.php",
        destination: "/patient",
        permanent: false,
      },
      {
        source: "/feature-showcase.php",
        destination: "/",
        permanent: false,
      },
      {
        source: "/healthcare_system/feature-showcase.php",
        destination: "/",
        permanent: false,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};
export default config;
