"use client";
import { useState } from "react";
import { parseDoctorInfo } from "@/lib/doctor-autofill";

const example = `Name: Dr. Example
Specialty: Cardiology
Qualification: MBBS, MD
Experience: 10 years
Location: Dhaka
Consultation fee: 1000
Available time: Sunday–Thursday, 5–9 PM
Phone: 01XXXXXXXXX
Hospital: Example Hospital`;

export function DoctorAutofill() {
  const [text, setText] = useState("");
  const [replace, setReplace] = useState(false);
  const [result, setResult] = useState("");
  return <fieldset className="stack">
    <legend>Paste &amp; Autofill doctor information</legend>
    <p>Paste one “Label: value” per line, using the example below. No AI or external service is used. Review the form before saving. Upload the photo separately.</p>
    <label>Doctor information
      <textarea rows={10} maxLength={20000} value={text} placeholder={example}
        onChange={e => setText(e.target.value)} />
    </label>
    <details><summary>Example format</summary><pre style={{whiteSpace: "pre-wrap"}}>{example}</pre></details>
    <label><input type="checkbox" checked={replace} onChange={e => setReplace(e.target.checked)} /> Replace existing field values</label>
    <button type="button" className="secondary" disabled={!text.trim()} onClick={e => {
      const form = e.currentTarget.form;
      if (!form) return;
      const select = form.elements.namedItem("specialty_id");
      const specialties = select instanceof HTMLSelectElement
        ? Array.from(select.options).filter(o => o.value).map(o => ({id: o.value, name: o.text})) : [];
      const parsed = parseDoctorInfo(text, specialties);
      let filled = 0;
      let skipped = 0;
      for (const [key, value] of Object.entries(parsed.values)) {
        const input = form.elements.namedItem(key);
        if (!(input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement || input instanceof HTMLSelectElement)) continue;
        if (input.value.trim() && !replace) { skipped++; continue; }
        input.value = value;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
        filled++;
      }
      setResult(`${filled} fields filled. ${skipped} existing fields kept. Review all values, then click the form’s save button. ${parsed.warnings.join(" ")}`);
    }}>Fill Form</button>
    <p role="status" style={{whiteSpace: "pre-wrap", overflowWrap: "anywhere"}}>{result}</p>
  </fieldset>;
}
