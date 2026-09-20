# Healthcare Central — Clinical LLM setup

Healthcare Central can now use an OpenAI language model as an optional language-understanding layer.

## What the LLM does

The model:
- understands free-form English, Bangla and Banglish;
- extracts symptoms, negation, uncertainty, severity, body site, laterality, onset and duration;
- recognizes when a message is probably a new complaint;
- rewrites the deterministic clinical engine's result into a more natural response.

The model does **not** make the final urgency, diagnosis, medication or doctor-selection decision. Existing Healthcare Central clinical rules, emergency rules and directory data remain authoritative.

## Required Vercel environment variable

Create this environment variable in the Vercel project:

```
OPENAI_API_KEY=your_secret_api_key
```

Optional:

```
OPENAI_CLINICAL_MODEL=gpt-5.6-luna
```

If `OPENAI_CLINICAL_MODEL` is omitted, Healthcare Central uses `gpt-5.6-luna`.

After adding or changing an environment variable, redeploy the project.

## Privacy

The API key must be stored only as a server-side environment variable. Never expose it in client-side code or commit it to GitHub.

When the LLM is enabled, the current patient message and a short recent conversation excerpt are sent server-side to the configured OpenAI API for language understanding. The API request is made with `store: false`.

## Failure behaviour

If the API key is missing, the API times out, or the model returns an invalid structured response, Healthcare Central automatically falls back to the existing v3 structured clinical engine.

## Architecture

```
Patient message
  -> OpenAI LLM language extraction
  -> validated / source-anchored facts
  -> HCC symptom concepts + episode memory
  -> deterministic emergency / triage engine
  -> HCC doctor / hospital / ambulance database
  -> optional LLM natural-language wording
  -> patient response
```

The LLM is therefore a language layer around Healthcare Central's safety and routing engine, not an autonomous medical decision maker.
