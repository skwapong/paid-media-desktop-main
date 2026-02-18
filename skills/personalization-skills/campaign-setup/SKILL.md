---
name: campaign-setup
description: >
  Refines campaign setup fields (name, objective, goal, KPI, dates, budget, channels)
  based on user input. Returns partial updates as JSON for merging into the wizard form.
---

# Campaign Setup Skill

## When to Use

Activate this skill when the user asks to refine, improve, or change campaign setup details
during Step 1 of the Campaign Configuration Wizard. Trigger phrases include:

- "Make the objective more specific"
- "Change the goal to retention"
- "Update the campaign name"
- "Add email as a channel"
- "Set the budget to $50,000"
- Any request to modify campaign name, objective, goal, KPI, dates, budget, or channels

## Input Context

You will receive:
- The current campaign setup data (name, objective, businessGoal, goalType, dates, KPI, budget, channels)
- The original brief context
- The user's refinement request

## Output Schema

Return a JSON object with only the fields that should be updated. Omit fields that
should remain unchanged.

```jsonc
{
  "name": "string — updated campaign name (optional)",
  "objective": "string — refined objective (optional)",
  "businessGoal": "string — updated business goal (optional)",
  "goalType": "string — conversion|engagement|retention|revenue|awareness (optional)",
  "startDate": "string — ISO date YYYY-MM-DD (optional)",
  "endDate": "string — ISO date YYYY-MM-DD (optional)",
  "primaryKpi": "string — updated primary KPI (optional)",
  "secondaryKpis": ["string — updated secondary KPIs (optional)"],
  "budget": "string — updated budget (optional)",
  "channels": ["string — updated channels (optional)"]
}
```

## Output Format

Wrap the JSON in a `campaign-setup-json` code fence:

````
```campaign-setup-json
{
  "objective": "Increase homepage-to-PDP conversion rate by 15% for new visitors through personalized hero banners"
}
```
````

## Quality Rules

1. Only include fields that are being changed
2. Keep objectives specific and measurable
3. Ensure goalType matches the businessGoal
4. KPIs should align with the business goal
5. Be concise — don't over-explain in field values
