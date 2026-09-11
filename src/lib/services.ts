export type Service = {
  icon: string;
  title: string;
  text: string;
  href: string;
};

export const services: Service[] = [
  {
    icon: "✚",
    title: "Doctors",
    text: "Find the right doctor by symptoms, specialty and location.",
    href: "/doctors",
  },
  {
    icon: "◒",
    title: "Medicines",
    text: "Search the medicine catalog and compare available listings.",
    href: "/medicines",
  },
  {
    icon: "♡",
    title: "Caregivers",
    text: "Explore caregiver and nursing support for everyday care.",
    href: "/caregivers",
  },
  {
    icon: "⌁",
    title: "Lab tests",
    text: "Find diagnostic tests, laboratories and listed prices.",
    href: "/lab-tests",
  },
  {
    icon: "✚",
    title: "Ambulance",
    text: "Find ambulance services based on the location you choose.",
    href: "/emergency",
  },
  {
    icon: "▦",
    title: "Hospitals",
    text: "Find hospitals, departments, locations and contact information.",
    href: "/hospitals",
  },
];
