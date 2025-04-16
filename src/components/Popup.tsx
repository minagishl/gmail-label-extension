import { useState } from "react";

const Popup = () => {
  const [status, setStatus] = useState<string>("");

  const handleOpenRules = () => {
    chrome.tabs.create({
      url: chrome.runtime.getURL("src/rules.html"),
    });
  };

  const handleApplyRules = async () => {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab?.url?.includes("mail.google.com")) {
      setStatus("Please open Gmail to apply rules");
      return;
    }

    setStatus("Applying rules...");

    try {
      if (tab.id) {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: applyLabelRules,
        });
        setStatus("Rules applied successfully!");
      }
    } catch (error) {
      setStatus(`Error applying rules: ${(error as Error).message}`);
    }
  };

  return (
    <div className="w-[200px] p-2.5 font-sans">
      <div className="flex flex-col gap-2">
        <button
          onClick={handleOpenRules}
          className="w-full cursor-pointer rounded border-none bg-blue-500 px-2 py-2 text-sm text-white hover:bg-blue-600"
        >
          Configure Rules
        </button>
        <button
          onClick={handleApplyRules}
          className="w-full cursor-pointer rounded border-none bg-blue-500 px-2 py-2 text-sm text-white hover:bg-blue-600"
        >
          Apply Rules
        </button>
        {status && (
          <div className="mt-0.5 text-center text-sm text-gray-600">
            {status}
          </div>
        )}
      </div>
    </div>
  );
};

// This function will be injected into the Gmail page
function applyLabelRules(): void {
  chrome.storage.sync.get("labelRules", function (data) {
    const rules = data.labelRules || [];
    if (rules.length === 0) {
      console.warn("No label rules found");
      return;
    }

    const container = document.querySelector('div[id=":1"]');
    if (!container) {
      console.warn("Gmail container not found");
      return;
    }

    const emailRows = container.querySelectorAll('tr[role="row"]');
    const emails = Array.from(emailRows).map((row) => {
      const senderEl = row.querySelector('span[translate="no"]');
      const subjectEl = row.querySelector(
        'div[role="link"] > div > div > span'
      );
      const snippetEl = row.querySelector('div[role="link"] > div > span');

      const senderName = senderEl ? senderEl.textContent?.trim() : null;
      const senderEmail =
        senderEl?.getAttribute("email") ||
        senderEl?.getAttribute("data-hovercard-id") ||
        null;

      return {
        element: row,
        sender: senderName,
        email: senderEmail,
        subject: subjectEl ? subjectEl.textContent?.trim() : null,
        snippet: snippetEl
          ? snippetEl.textContent?.trim()?.replace(/^ – /, "")
          : null,
      };
    });

    // Apply rules to each email
    emails.forEach((email) => {
      rules.forEach((rule: any) => {
        let matches = false;

        if (rule.sender && email.sender) {
          matches = email.sender
            .toLowerCase()
            .includes(rule.sender.toLowerCase());
        }
        if (!matches && rule.email && email.email) {
          matches = email.email
            .toLowerCase()
            .includes(rule.email.toLowerCase());
        }
        if (!matches && rule.subject && email.subject) {
          matches = email.subject
            .toLowerCase()
            .includes(rule.subject.toLowerCase());
        }
        if (!matches && rule.content && email.snippet) {
          matches = email.snippet
            .toLowerCase()
            .includes(rule.content.toLowerCase());
        }

        if (matches) {
          // TODO: Implement Gmail label API integration
          console.log(`Match found! Apply label "${rule.label}" to:`, email);
        }
      });
    });
  });
}

export default Popup;
