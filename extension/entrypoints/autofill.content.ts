export default defineContentScript({
  matches: ["<all_urls>"],
  runAt: "document_idle",
  allFrames: false,
  main() {
    type AutofillPayload = { email: string; password: string };
    type AutofillMessage = { type: "ONE_ACCOUNT_AUTOFILL"; payload: AutofillPayload };

    function isVisible(el: HTMLElement): boolean {
      const style = window.getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return false;
      const rect = el.getBoundingClientRect();
      // hidden offscreen or zero size is likely not the login form
      if (rect.width === 0 && rect.height === 0) return false;
      return true;
    }

    function isEditableInput(el: HTMLInputElement): boolean {
      if (el.disabled || el.readOnly) return false;
      if (el.type === "hidden") return false;
      // allow text, email, username-like, password
      return isVisible(el as unknown as HTMLElement);
    }

    function setNativeValue(input: HTMLInputElement, value: string) {
      const proto = input.tagName === "INPUT" ? HTMLInputElement.prototype : HTMLTextAreaElement.prototype;
      const descriptor = Object.getOwnPropertyDescriptor(proto, "value");
      const setter = descriptor?.set;
      if (setter) {
        setter.call(input, value);
      } else {
        input.value = value;
      }
      // React / Vue / Angular all listen to these
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
      input.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "a" }));
      input.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, key: "a" }));
    }

    function queryInputs(): HTMLInputElement[] {
      return Array.from(document.querySelectorAll<HTMLInputElement>("input")).filter(isEditableInput);
    }

    function findPasswordInput(inputs: HTMLInputElement[]): HTMLInputElement | null {
      const pwds = inputs.filter((i) => i.type === "password");
      if (pwds.length === 0) return null;
      // prefer visible, not inside a hidden container, first that is not aria-hidden
      return pwds.find(isVisible) ?? pwds[0] ?? null;
    }

    function findUsernameInput(inputs: HTMLInputElement[], pwd: HTMLInputElement | null): HTMLInputElement | null {
      // 1) explicit types / autocomplete hints
      const candidates = inputs.filter((i) => i !== pwd);
      const score = (el: HTMLInputElement): number => {
        const hay = `${el.name} ${el.id} ${el.placeholder} ${el.autocomplete} ${el.getAttribute("aria-label") ?? ""}`.toLowerCase();
        if (el.type === "email") return 10;
        if (hay.includes("email")) return 9;
        if (hay.includes("username") || hay.includes("user-name") || hay.includes("user_name")) return 8;
        if (hay.includes("login")) return 7;
        if (hay.includes("user")) return 5;
        if (el.type === "text") return 3;
        if (el.type === "tel") return 2;
        return 0;
      };
      const ranked = [...candidates].sort((a, b) => score(b) - score(a));
      if (ranked.length > 0 && score(ranked[0]) > 0) return ranked[0];

      // 2) heuristic: the text input immediately before password in DOM order
      if (pwd) {
        const pwdIndex = inputs.indexOf(pwd);
        for (let i = pwdIndex - 1; i >= 0; i--) {
          const c = inputs[i];
          if (c.type === "text" || c.type === "email" || c.type === "tel") return c;
        }
      }

      // 3) first visible text/email input
      return (
        candidates.find((i) => i.type === "email" || i.type === "text") ??
        candidates[0] ??
        null
      );
    }

    function findSubmitButton(pwd: HTMLInputElement | null, user: HTMLInputElement | null): HTMLElement | null {
      const anchor: HTMLElement | null = (pwd ?? user) as unknown as HTMLElement | null;
      const form = anchor?.closest?.("form") ?? document.querySelector("form");
      if (form) {
        const btn =
          form.querySelector<HTMLElement>('button[type="submit"]') ??
          form.querySelector<HTMLElement>('input[type="submit"]') ??
          form.querySelector<HTMLElement>("button:not([type])");
        if (btn && isVisible(btn)) return btn;
        // fallback: any button that looks like submit inside form
        const buttons = Array.from(form.querySelectorAll<HTMLElement>("button, [role=button], input[type=button]"));
        const submitLike = buttons.find((b) => {
          const t = (b.textContent ?? (b as HTMLInputElement).value ?? "").toLowerCase();
          return /log\s*in|sign\s*in|submit|continue|next/.test(t);
        });
        if (submitLike && isVisible(submitLike)) return submitLike;
      }
      // global fallback
      const globalSubmit = document.querySelector<HTMLElement>('button[type="submit"], input[type="submit"]');
      if (globalSubmit && isVisible(globalSubmit)) return globalSubmit;
      const allButtons = Array.from(document.querySelectorAll<HTMLElement>("button"));
      const fallback = allButtons.find((b) => {
        if (!isVisible(b)) return false;
        const t = (b.textContent ?? "").toLowerCase();
        return /log\s*in|sign\s*in|submit/.test(t);
      });
      return fallback ?? null;
    }

    function autofill(payload: AutofillPayload): { filledUsername: boolean; filledPassword: boolean; focusedSubmit: boolean } {
      const inputs = queryInputs();
      const pwd = findPasswordInput(inputs);
      const user = findUsernameInput(inputs, pwd);

      let filledUsername = false;
      let filledPassword = false;

      if (user) {
        user.focus();
        setNativeValue(user, payload.email);
        filledUsername = true;
      }
      if (pwd) {
        pwd.focus();
        setNativeValue(pwd, payload.password);
        filledPassword = true;
      }

      // If only one of the fields was found, try to at least fill what exists.
      // Password-only forms (e.g. re-auth) and email-only first steps are supported.

      const submit = findSubmitButton(pwd, user);
      let focusedSubmit = false;
      if (submit) {
        try {
          submit.focus();
          // Scroll into view so user sees focused button; do not auto-click (user requested focus only)
          submit.scrollIntoView({ block: "center", inline: "center", behavior: "smooth" });
          focusedSubmit = true;
        } catch {
          // ignore
        }
      } else {
        // If no submit exists, leave focus on password (common: field drives next step)
        if (pwd) pwd.focus();
        else if (user) user.focus();
      }

      return { filledUsername, filledPassword, focusedSubmit };
    }

    browser.runtime.onMessage.addListener((msg: unknown, _sender, sendResponse) => {
      const m = msg as Partial<AutofillMessage>;
      if (m?.type !== "ONE_ACCOUNT_AUTOFILL" || !m.payload) return;

      try {
        const result = autofill(m.payload);
        sendResponse({ ok: true, ...result });
      } catch (e) {
        sendResponse({ ok: false, error: e instanceof Error ? e.message : String(e) });
      }
      return true;
    });
  },
});
