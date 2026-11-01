import { test } from "node:test";
import assert from "node:assert/strict";
import {
  classifyConceptMatches,
  redFlagAnswerIsPositive,
  type ClinicalConceptMatch,
} from "../src/lib/clinical-reasoning";

// ECC-inspired clinical safety regressions. These test language parsing,
// NOT clinical diagnostic accuracy or the Supabase triage policy.
function mention(query: string, alias: string) {
  const match: ClinicalConceptMatch = {
    concept_id: "00000000-0000-4000-8000-000000000001",
    code: alias.replace(/\s+/g, "_"),
    canonical_name: alias,
    canonical_bn: null,
    matched_alias: alias,
    score: 0.97,
    normalized_query: query,
  };
  return classifyConceptMatches(query, [match])[0];
}

test("English negative symptom and separate positive symptom remain distinct", () => {
  assert.equal(mention("no chest pain but breathlessness", "chest pain").polarity, "absent");
  assert.equal(mention("no chest pain but breathlessness", "breathlessness").polarity, "present");
});

test("Banglish negation and positive symptom remain distinct", () => {
  assert.equal(mention("buk betha nai kintu shash kosto hocche", "buk betha").polarity, "absent");
  assert.equal(mention("buk betha nai kintu shash kosto hocche", "shash kosto").polarity, "present");
});

test("do not invent a positive symptom when a negation is explicit", () => {
  assert.equal(mention("I do not have weakness", "weakness").polarity, "absent");
  assert.equal(mention("amar durbolota nai", "durbolota").polarity, "absent");
  assert.equal(mention("দুর্বলতা নেই কিন্তু মাথা ঘুরছে", "দুর্বলতা").polarity, "absent");
  assert.equal(mention("দুর্বলতা নেই কিন্তু মাথা ঘুরছে", "মাথা ঘুরছে").polarity, "present");
});

test("mixed red-flag responses must not hide a positive emergency signal", () => {
  assert.equal(redFlagAnswerIsPositive("no weakness but cannot breathe"), true);
  assert.equal(redFlagAnswerIsPositive("no bleeding but sudden vision loss"), true);
  assert.equal(redFlagAnswerIsPositive("rokto nai kintu shash nite parchi na"), true);
  assert.equal(redFlagAnswerIsPositive("রক্ত নেই কিন্তু শ্বাস নিতে পারছি না"), true);
});

test("unambiguous negative answers are not positive emergency answers", () => {
  assert.equal(redFlagAnswerIsPositive("no"), false);
  assert.equal(redFlagAnswerIsPositive("নেই"), false);
  assert.equal(redFlagAnswerIsPositive("No weakness"), false);
  assert.equal(redFlagAnswerIsPositive("No bleeding and no weakness"), false);
  assert.equal(redFlagAnswerIsPositive("Not sure"), false);
});

test("unambiguous affirmative answers are recognized", () => {
  assert.equal(redFlagAnswerIsPositive("yes"), true);
  assert.equal(redFlagAnswerIsPositive("হ্যাঁ"), true);
  assert.equal(redFlagAnswerIsPositive("cannot breathe"), true);
});
