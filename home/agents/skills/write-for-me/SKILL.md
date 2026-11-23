---
name: write-for-me
description: The user asks you to write a message they will send as their own, such as a reply to a customer, a colleague, or a chat, or says "write-for-me", "escreve por mim", or "me dá uma msg".
---

Write the message the user will paste and send under their name. The reader is the recipient, not the user, so the message speaks as the user, in the first person, straight to the recipient.

## Match the channel and the user's voice

Write in the language the user uses with this recipient; use Brazilian Portuguese when it is unknown. For a chat, support reply, or direct message, write the way the user types there: lowercase is fine, a casual opener such as "cara" is fine, and "a gente" stands for the user's team. Use no headings, bullets, or bold unless the channel renders them. Write up to three steps as one sentence; put more steps one per line, numbered, so the recipient can follow them while doing them.

A message the user pastes, from them or from anyone else, shows only the register: formal or casual, close or distant. Do not imitate its emojis, slang, greeting, or catchphrases; the message still sounds like the user.

## Say only what the recipient needs to act

Open with the cause in the recipient's terms: what happened and whose side it came from. Name the concrete value, record, or screen involved so the recipient can find it. Explain a technical term once, inline, in the recipient's words, unless the recipient already works with it, such as a developer reading "lock timeout". Close with what the recipient does next, in the order they do it.

Leave out the evidence that convinced you: error codes, algorithms, attempt counts, internal names, and how you investigated. A warning or a related case goes in only when it changes what the recipient does now. Add no fact the investigation did not establish, such as a doubt nobody raised or a link to an earlier topic. Never put a guessed value in the message; ask the recipient to get the real one.

## Example

The investigation found that a buyer typed an invalid state registration (IE) in the marketplace, and the seller kept retrying the invoice. A report-style message misses the voice:

> Oi! Descobrimos por que a nota dessa venda não sai.
>
> 1. Peça a Inscrição Estadual correta ao comprador.
> 2. Na Dogama, abra a venda e edite o endereço.
> 3. Emita a nota de novo.

The user's own message for the same case:

> cara, isso foi um erro do comprador no próprio mercado livre. a gente usa um dado dele que chama IE (Inscrição estadual), ele colocou esse valor aqui: 123456780 e não é válido no caso dele, então o sistema de emitir nota fiscal do governo tá recusando.
>
> o que tem que fazer é pedir ao comprador pra arrumar isso ou passar o valor correto, ir na venda da Dogama e em editar endereço, colocar o valor certo

## Hand it over

Reply with the message alone, ready to paste, with no introduction such as "here is the message". If you left out a fact the user may still want to send, such as an unconfirmed value or a separate issue, name it in one line after the message, addressed to the user. Do not list the evidence you cut.
