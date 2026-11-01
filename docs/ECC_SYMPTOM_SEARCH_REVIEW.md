# ECC-guided symptom-search safety hardening

This change uses a narrow, project-specific reviewer workflow adapted from the MIT-licensed [Everything Claude Code](https://github.com/affaan-m/ECC). It does **not** run 71 agents in production. The optional clinical LLM remains a language extraction layer, not a medical decision maker.

## Findings fixed

1. In `src/lib/clinical-reasoning.ts`, symptom negation is now scoped to contrast clauses (English, Banglish, Bengali). A complaint described as absent must not erase another positive complaint.
2. Red-flag screening answers are now evaluated clause by clause. In particular, "no weakness but cannot breathe" must not be treated as an all-negative response.
3. In `src/app/api/assistant/route.ts`, an unrelated absent symptom no longer cancels an urgent database routing result when another symptom is present or uncertain.

## Regression examples

- "no chest pain but breathlessness"
- "buk betha nai kintu shash kosto hocche"
- "দুর্বলতা নেই কিন্তু মাথা ঘুরছে"
- "no weakness but cannot breathe"
- "রক্ত নেই কিন্তু শ্বাস নিতে পারছি না"
- "no bleeding and no weakness"

These are **language-understanding and safety regression examples**, not sufficient clinical validation.

## Developer checks

```bash
npm ci
npm run typecheck
npm test
```

Run `node --import tsx --test tests/clinical-reasoning.test.ts` for the focused suite. A GitHub Actions workflow runs checks for the symptom-related pull request.

## Release gates

- Clinical review by a qualified reviewer of emergency routing and all language variants.
- Integration checks against the currently deployed Supabase migrations and `resolve_doctor_triage_multi` RPC.
- Verify that LLM timeout, malformed output and disabled OpenAI API still lead to safe fallback behavior.
- Test actual API conversations and follow-up episode memory; the unit tests do not cover full end-to-end navigation.
- Measure false-negative and false-positive triage changes against a clinician-approved test set. Do not claim diagnostic accuracy without evaluation.
- Keep medical messages, credentials and identifying data out of logs and repository history.

Do not auto-merge or deploy before these gates pass.

## Upstream attribution

Workflow adapted from ECC agents `healthcare-reviewer`, `bengali-reviewer`, `security-reviewer`, and `tdd-guide` under the project's MIT license. See upstream repository for full license and attribution.
