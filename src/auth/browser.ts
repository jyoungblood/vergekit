export const DEFAULT_AUTH_ERROR_MESSAGE =
  "We couldn't complete that request. Check the fields and try again.";

type Fetcher = typeof fetch;

interface HandleAuthFormSubmitOptions {
  fetcher?: Fetcher;
}

type AuthResponsePayload = {
  redirect?: unknown;
  url?: unknown;
  token?: unknown;
  user?: unknown;
};

export function extractAuthErrorMessage(payload: unknown) {
  if (!payload || typeof payload !== 'object') {
    return DEFAULT_AUTH_ERROR_MESSAGE;
  }

  const record = payload as Record<string, unknown>;

  if (typeof record.message === 'string' && record.message.trim()) {
    return record.message;
  }

  if (typeof record.error === 'string' && record.error.trim()) {
    return record.error;
  }

  if (
    record.error &&
    typeof record.error === 'object' &&
    'message' in record.error
  ) {
    const nestedMessage = (record.error as Record<string, unknown>).message;

    if (typeof nestedMessage === 'string' && nestedMessage.trim()) {
      return nestedMessage;
    }
  }

  return DEFAULT_AUTH_ERROR_MESSAGE;
}

export function resolveAuthRedirectTarget(target: unknown) {
  if (typeof target !== 'string' || !target.trim()) {
    return null;
  }

  const currentOrigin = window.location.origin;
  let redirectURL: URL;

  try {
    redirectURL = new URL(target, currentOrigin);
  } catch {
    return null;
  }

  if (redirectURL.origin !== currentOrigin) {
    return null;
  }

  return `${redirectURL.pathname}${redirectURL.search}${redirectURL.hash}`;
}

function getFormErrorElement(form: HTMLFormElement) {
  const errorId = form.dataset.authError;

  if (!errorId) {
    return null;
  }

  const errorElement = document.getElementById(errorId);
  return errorElement instanceof HTMLElement ? errorElement : null;
}

function setFormError(form: HTMLFormElement, message: string) {
  const errorElement = getFormErrorElement(form);

  if (!errorElement) {
    return;
  }

  errorElement.textContent = message;
  errorElement.removeAttribute('hidden');
}

function clearFormError(form: HTMLFormElement) {
  const errorElement = getFormErrorElement(form);

  if (!errorElement) {
    return;
  }

  errorElement.textContent = '';
  errorElement.setAttribute('hidden', '');
}

function setFormSubmitting(form: HTMLFormElement, isSubmitting: boolean) {
  const submitButton = form.querySelector<HTMLButtonElement>(
    'button[type="submit"]',
  );

  if (submitButton) {
    submitButton.disabled = isSubmitting;
    submitButton.setAttribute('aria-busy', String(isSubmitting));
  }
}

async function parseAuthResponse(response: Response) {
  const contentType = response.headers.get('content-type') ?? '';

  if (!contentType.includes('application/json')) {
    return null;
  }

  return response.json();
}

function getFallbackRedirect(form: HTMLFormElement) {
  const callbackURL = new FormData(form).get('callbackURL');
  return resolveAuthRedirectTarget(callbackURL) ?? '/dashboard';
}

function getSuccessRedirect(payload: unknown, form: HTMLFormElement) {
  const authPayload =
    payload && typeof payload === 'object'
      ? (payload as AuthResponsePayload)
      : null;

  return (
    resolveAuthRedirectTarget(authPayload?.url) ??
    resolveAuthRedirectTarget(form.getAttribute('data-auth-success-url')) ??
    getFallbackRedirect(form)
  );
}

type AuthFormPayload = Record<string, boolean | string>;

function serializeForm(form: HTMLFormElement) {
  const payload: AuthFormPayload = {};

  for (const element of Array.from(form.elements)) {
    if (
      !(
        element instanceof HTMLInputElement ||
        element instanceof HTMLSelectElement ||
        element instanceof HTMLTextAreaElement
      )
    ) {
      continue;
    }

    if (!element.name || element.disabled) {
      continue;
    }

    if (element instanceof HTMLInputElement) {
      if (element.type === 'checkbox') {
        payload[element.name] = element.checked;
        continue;
      }

      if (element.type === 'radio') {
        if (element.checked) {
          payload[element.name] = element.value;
        }
        continue;
      }

      if (element.type === 'file') {
        continue;
      }
    }

    payload[element.name] = element.value;
  }

  return payload;
}

export async function handleAuthFormSubmit(
  form: HTMLFormElement,
  { fetcher = fetch }: HandleAuthFormSubmitOptions = {},
) {
  clearFormError(form);
  setFormSubmitting(form, true);

  try {
    const response = await fetcher(form.getAttribute('action') ?? form.action, {
      method: form.method.toUpperCase(),
      body: JSON.stringify(serializeForm(form)),
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });
    const payload = await parseAuthResponse(response);

    if (!response.ok) {
      setFormError(form, extractAuthErrorMessage(payload));
      return null;
    }

    return getSuccessRedirect(payload, form);
  } catch {
    setFormError(form, DEFAULT_AUTH_ERROR_MESSAGE);
    return null;
  } finally {
    setFormSubmitting(form, false);
  }
}

export function mountAuthForms(root: ParentNode = document) {
  const forms = root.querySelectorAll<HTMLFormElement>('form[data-auth-form]');

  for (const form of forms) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const redirectTo = await handleAuthFormSubmit(form);

      if (redirectTo) {
        window.location.assign(redirectTo);
      }
    });
  }
}
