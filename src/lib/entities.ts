import { z } from "zod";
export type Field = {
  key: string;
  label: string;
  type?: "text" | "textarea" | "number" | "email" | "select" | "date";
  required?: boolean;
  options?: string[];
};
export type Entity = {
  title: string;
  singular: string;
  nameKey: string;
  description: string;
  fields: Field[];
};
const f = (
  key: string,
  label: string,
  type: Field["type"] = "text",
  required = false,
  options?: string[],
): Field => ({ key, label, type, required, options });
const status = f("status", "Status", "select", true, ["Active", "Inactive"]);
export const entities: Record<string, Entity> = {
  doctors: {
    title: "Doctors",
    singular: "Doctor",
    nameKey: "full_name",
    description: "Find doctors by name, specialty, location or symptoms.",
    fields: [
      f("full_name", "Full name", "text", true),
      f("registration_no", "Registration number"),
      f("specialty_id", "Specialty", "select", true),
      f("specialization", "Specialization"),
      f("qualification", "Qualification"),
      f("experience", "Experience (years)", "number"),
      f("location", "Location"),
      f("consultation_fee", "Consultation fee (BDT)", "number"),
      f("available_time", "Available time"),
      f("phone", "Phone"),
      f("email", "Email", "email"),
      f("user_id", "Linked doctor account UUID"),
      status,
    ],
  },
  hospitals: {
    title: "Hospitals",
    singular: "Hospital",
    nameKey: "name",
    description: "Explore locations, departments and contact information.",
    fields: [
      f("name", "Hospital name", "text", true),
      f("address", "Address", "textarea"),
      f("location", "Location"),
      f("phone", "Phone"),
      f("email", "Email", "email"),
      f("emergency_phone", "Emergency phone"),
      f("departments", "Departments"),
      f("description", "Description", "textarea"),
      status,
    ],
  },
  caregivers: {
    title: "Caregivers & nurses",
    singular: "Caregiver",
    nameKey: "full_name",
    description: "Compare caregiver experience, availability and daily fees.",
    fields: [
      f("full_name", "Full name", "text", true),
      f("gender", "Gender", "select", false, ["Female", "Male", "Other"]),
      f("experience", "Experience (years)", "number"),
      f("qualification", "Qualification"),
      f("services", "Services", "textarea"),
      f("location", "Location"),
      f("fee_per_day", "Daily fee (BDT)", "number"),
      f("phone", "Phone"),
      f("email", "Email", "email"),
      f("availability", "Availability"),
      status,
    ],
  },
  ambulances: {
    title: "Ambulance services",
    singular: "Ambulance",
    nameKey: "service_name",
    description: "Search services by location, hospital or vehicle type.",
    fields: [
      f("service_name", "Service name", "text", true),
      f("driver_name", "Driver name"),
      f("driver_phone", "Driver phone"),
      f("ambulance_type", "Ambulance type"),
      f("vehicle_number", "Vehicle number"),
      f("location", "Location"),
      f("address", "Address"),
      f("city", "City"),
      f("hospital_name", "Hospital name"),
      f("availability", "Availability"),
      f("rate", "Rate (BDT)", "number"),
      status,
    ],
  },
  lab_tests: {
    title: "Lab tests",
    singular: "Lab test",
    nameKey: "test_name",
    description: "Find diagnostic tests and compare listed laboratory prices.",
    fields: [
      f("test_name", "Test name", "text", true),
      f("laboratory_name", "Laboratory name"),
      f("category", "Category"),
      f("description", "Description", "textarea"),
      f("price", "Price (BDT)", "number"),
      f("location", "Location"),
      f("address", "Address"),
      f("contact", "Contact"),
      status,
    ],
  },
  specialties: {
    title: "Specialties",
    singular: "Specialty",
    nameKey: "name",
    description: "Manage the specialty list used by doctor profiles.",
    fields: [f("name", "Specialty name", "text", true)],
  },
  symptom_rules: {
    title: "Symptom rules",
    singular: "Symptom rule",
    nameKey: "keyword",
    description: "Maintain reviewed keyword-to-specialty routing rules.",
    fields: [
      f("keyword", "Keyword", "text", true),
      f("specialty_id", "Specialty", "select", true),
      f("priority", "Priority", "number", true),
      f("emergency_notice", "Emergency notice", "textarea"),
    ],
  },
  medicines: {
    title: "Medicine catalog",
    singular: "Medicine",
    nameKey: "name",
    description: "Maintain medicine names and strengths.",
    fields: [
      f("name", "Medicine name", "text", true),
      f("generic", "Generic name"),
      f("strength", "Strength"),
      status,
    ],
  },
  medicine_offers: {
    title: "Medicine offers",
    singular: "Offer",
    nameKey: "seller",
    description: "Maintain catalog prices with a source and date.",
    fields: [
      f("medicine_id", "Medicine", "select", true),
      f("seller", "Seller", "text", true),
      f("price", "Price (BDT)", "number", true),
      f("url", "Source URL", "text", true),
      f("checked_on", "Checked on", "date", true),
    ],
  },
};
export type Row = {
  id: string;
  created_at?: string;
  image_path?: string | null;
  [key: string]: string | number | boolean | null | undefined;
};
export function entitySchema(entity: Entity) {
  const shape: Record<string, z.ZodType> = {};
  for (const field of entity.fields) {
    let schema: z.ZodType =
      field.type === "number"
        ? z.coerce.number().finite().min(0).max(100000000)
        : z
            .string()
            .trim()
            .max(field.type === "textarea" ? 4000 : 300);
    if (field.key.endsWith("_id")) schema = z.uuid();
    else if (field.key === "url")
      schema = z
        .url()
        .refine((v) => new URL(v).protocol === "https:", "Use an HTTPS URL");
    else if (field.type === "email") schema = z.email();
    else if (field.type === "date") schema = z.iso.date();
    else if (field.options)
      schema = z.enum(field.options as [string, ...string[]]);
    else if (field.required && field.type !== "number")
      schema = z.string().trim().min(1).max(300);
    shape[field.key] = field.required
      ? schema
      : z.preprocess(
          (v) => (v === "" || v === undefined ? null : v),
          schema.nullable(),
        );
  }
  return z.object(shape).strict();
}
export const publicEntities = [
  "doctors",
  "hospitals",
  "caregivers",
  "ambulances",
  "lab_tests",
];
