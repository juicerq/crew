#!/usr/bin/env python3
import json
import sys
from datetime import datetime


def text_of(content):
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        out = []
        for b in content:
            if not isinstance(b, dict):
                continue
            if b.get("type") == "text":
                out.append(b.get("text", ""))
            elif b.get("type") == "tool_result":
                c = b.get("content")
                if isinstance(c, str):
                    out.append(c)
        return "\n".join(out)
    return ""


def digest(path):
    title = None
    last_prompt = None
    user_msgs = []
    last_assistant_text = ""
    files = {}
    todos = []
    first_ts = None
    last_ts = None

    for line in open(path, encoding="utf-8"):
        try:
            d = json.loads(line)
        except Exception:
            continue
        t = d.get("type")
        ts = d.get("timestamp")
        if ts:
            first_ts = first_ts or ts
            last_ts = ts
        if t == "ai-title":
            title = d.get("aiTitle") or title
        elif t == "last-prompt":
            last_prompt = d.get("lastPrompt") or last_prompt
        elif t == "user":
            m = d.get("message", {})
            txt = text_of(m.get("content")).strip()
            if txt and not txt.startswith("<") and "tool_result" not in txt[:30]:
                user_msgs.append(txt)
        elif t == "assistant":
            m = d.get("message", {})
            for b in m.get("content", []) if isinstance(m.get("content"), list) else []:
                if not isinstance(b, dict):
                    continue
                if b.get("type") == "text" and b.get("text", "").strip():
                    last_assistant_text = b["text"].strip()
                elif b.get("type") == "tool_use":
                    name = b.get("name")
                    inp = b.get("input", {})
                    if name in ("Edit", "Write", "NotebookEdit"):
                        fp = inp.get("file_path")
                        if fp:
                            files[fp] = files.get(fp, 0) + 1
                    if name in ("TodoWrite",) and isinstance(inp.get("todos"), list):
                        todos = inp["todos"]

    real_user = [u for u in user_msgs if u != last_prompt]
    print(f"# {title or '(sem título)'}")
    print(f"Período: {(first_ts or '?')[:16]} → {(last_ts or '?')[:16]}")
    print()
    print("## Primeira mensagem do usuário")
    print((real_user[0] if real_user else "(nenhuma)")[:600])
    print()
    print("## Últimas mensagens do usuário (até 5)")
    for u in user_msgs[-5:]:
        print(f"- {u[:300]}")
    print()
    print("## Último prompt digitado (onde parou)")
    print((last_prompt or "(nenhum)")[:600])
    print()
    print("## Arquivos editados (count)")
    for fp, n in sorted(files.items(), key=lambda x: -x[1])[:25]:
        print(f"- {n}x {fp}")
    if not files:
        print("(nenhum arquivo editado)")
    print()
    if todos:
        print("## Estado do TODO no fim")
        for td in todos:
            st = td.get("status", "?")
            print(f"- [{st}] {td.get('content', '')[:160]}")
        print()
    print("## Última fala do assistente")
    print(last_assistant_text[:1200] or "(nenhuma)")


if __name__ == "__main__":
    digest(sys.argv[1])
