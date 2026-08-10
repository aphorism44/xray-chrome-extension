const OPENAI_API_KEY_STORAGE_KEY =
  "openaiApiKey";

const apiKeyInput =
  document.getElementById(
    "api-key"
  ) as HTMLInputElement | null;

const saveButton =
  document.getElementById(
    "save-key"
  ) as HTMLButtonElement | null;

const removeButton =
  document.getElementById(
    "remove-key"
  ) as HTMLButtonElement | null;

const statusElement =
  document.getElementById(
    "status"
  );

async function loadSettings(): Promise<void> {
  if (!apiKeyInput) {
    return;
  }

  const result =
    await chrome.storage.local.get(
      OPENAI_API_KEY_STORAGE_KEY
    );

  const savedKey =
    result[
      OPENAI_API_KEY_STORAGE_KEY
    ];

  if (
    typeof savedKey === "string" &&
    savedKey.length > 0
  ) {
    apiKeyInput.value = savedKey;

    setStatus(
      "An API key is currently saved."
    );
  }
}

async function saveApiKey(): Promise<void> {
  if (!apiKeyInput) {
    return;
  }

  const apiKey =
    apiKeyInput.value.trim();

  if (!apiKey) {
    setStatus(
      "Enter an API key first."
    );

    return;
  }

  await chrome.storage.local.set({
    [OPENAI_API_KEY_STORAGE_KEY]:
      apiKey
  });

  setStatus(
    "API key saved."
  );
}

async function removeApiKey(): Promise<void> {
  await chrome.storage.local.remove(
    OPENAI_API_KEY_STORAGE_KEY
  );

  if (apiKeyInput) {
    apiKeyInput.value = "";
  }

  setStatus(
    "API key removed."
  );
}

function setStatus(
  message: string
): void {
  if (statusElement) {
    statusElement.textContent =
      message;
  }
}

saveButton?.addEventListener(
  "click",
  () => {
    saveApiKey().catch(error => {
      console.error(
        "Could not save API key:",
        error
      );

      setStatus(
        "Could not save API key."
      );
    });
  }
);

removeButton?.addEventListener(
  "click",
  () => {
    removeApiKey().catch(error => {
      console.error(
        "Could not remove API key:",
        error
      );

      setStatus(
        "Could not remove API key."
      );
    });
  }
);

loadSettings().catch(error => {
  console.error(
    "Could not load X-Ray settings:",
    error
  );
});