import { test } from "node:test";
import assert from "node:assert/strict";
import { parseDoctorInfo } from "../src/lib/doctor-autofill";
test("maps labeled details, preserves phone and matches specialty", () => {
  const r = parseDoctorInfo("Name: Dr. Test\nSpecialty: cardiology\nFee: BDT 1,000\nExperience: ১০ years\nPhone: 01700000000\nAvailable time: 5:00–9:00 PM", [{id:"cardio",name:"Cardiology"}]);
  assert.equal(r.values.specialty_id, "cardio");
  assert.equal(r.values.consultation_fee, "1000");
  assert.equal(r.values.experience, "10");
  assert.equal(r.values.phone, "01700000000");
  assert.equal(r.values.available_time, "5:00–9:00 PM");
  assert.equal(r.warnings.length, 0);
});
test("does not invent values or allow account linkage from paste", () => {
  const r = parseDoctorInfo("Specialty: Unknown\nExperience: 10-15 years\nFee: call us\nuser_id: malicious\nSome biography", []);
  assert.deepEqual(r.values, {});
  assert.equal(r.warnings.length, 5);
});
