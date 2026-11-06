---
name: domain-modeling
description: Resolve uncertain product terms, concept boundaries, and allowed states before those meanings become code or rules.
---

Settle an ambiguous product term before it becomes a field or rule. Test it against two ordinary scenarios: if "customer" is the payer in a normal purchase but the recipient in a gift purchase, one field loses a distinction. Propose precise terms in the project's language. When code and conversation cannot settle the intended rule, ask the user; code shows current behavior, not intent.

When the project has a glossary, read the context that owns a term before using it. When maintaining the glossary:

- The map lists contexts, their relationships, and words whose meaning changes between contexts.
- Each context opens with its name and a one-line description, then its terms and resolved ambiguities.
- Each term has one home; other contexts refer to it.
- A definition says what the thing is in one to three sentences. Implementation details stay in code.
- An avoid line lists rejected synonyms.
- A resolved ambiguity names the word, its competing senses, and the decision.
