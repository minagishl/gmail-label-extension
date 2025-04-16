import { StorageData } from "./types";

// Search for the div that affects mail rows
function searchMailRowsContainer(): Promise<HTMLElement> {
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      const navigationDiv = document.querySelector('div[role="navigation"]');
      if (navigationDiv) {
        const parent = navigationDiv.parentElement;
        if (parent?.parentElement) {
          clearInterval(interval);
          resolve(parent.parentElement);
        }
      }
    }, 1000);
  });
}

// Search for mail container element
function searchMailElement(): Promise<HTMLElement> {
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      const p1 = document.querySelector('table[role="grid"] > tbody');
      const p2 = document.querySelector('table[aria-readonly="true"] > tbody');
      if (p1) {
        clearInterval(interval);
        resolve(p1 as HTMLElement);
      }
      if (p2) {
        clearInterval(interval);
        resolve(p2 as HTMLElement);
      }
    }, 1000);
  });
}

// Create visual label for an email
function createVisualLabel(
  labelName: string,
  color = "#4285f4"
): HTMLDivElement {
  const div = document.createElement("div");
  div.style.height = "16px";
  div.style.backgroundColor = color;
  div.style.borderRadius = "4px";
  div.style.display = "flex";
  div.style.alignItems = "center";
  div.style.justifyContent = "center";
  div.style.margin = "0px 10px 0 0";
  div.style.padding = "2px 6px";
  div.style.whiteSpace = "nowrap";

  const p = document.createElement("p");
  p.innerText = labelName;
  p.style.fontSize = "12px";
  p.style.color = "white";

  div.appendChild(p);
  return div;
}

// Process a single email element
async function processEmailElement(element: HTMLElement): Promise<void> {
  // Get specific parts of the email
  const sender =
    element.querySelector("[email]")?.getAttribute("email")?.toLowerCase() ||
    "";
  const senderName =
    element.querySelector("[name]")?.getAttribute("name")?.toLowerCase() || "";
  const subject =
    element.querySelector("[data-thread-id]")?.textContent?.toLowerCase() || "";
  const snippet =
    element.querySelector(".y2")?.textContent?.toLowerCase() || "";

  // Get rules from storage
  const data = (await chrome.storage.sync.get("labelRules")) as StorageData;
  const rules = data.labelRules || [];

  // Check each rule
  for (const rule of rules) {
    let matches = false;

    // Match against rule conditions with specific email parts
    const matchesSender =
      rule.sender &&
      rule.sender
        .toLowerCase()
        .split(",")
        .some(
          (word) =>
            word.trim() &&
            (senderName.includes(word.trim()) || sender.includes(word.trim()))
        );
    const matchesEmail =
      rule.email &&
      rule.email
        .toLowerCase()
        .split(",")
        .some((word) => word.trim() && sender.includes(word.trim()));
    const matchesSubject =
      rule.subject &&
      rule.subject
        .toLowerCase()
        .split(",")
        .some((word) => word.trim() && subject.includes(word.trim()));
    const matchesContent =
      rule.content &&
      rule.content
        .toLowerCase()
        .split(",")
        .some((word) => word.trim() && snippet.includes(word.trim()));

    // If any condition matches, set matches to true
    matches = Boolean(
      matchesSender || matchesEmail || matchesSubject || matchesContent
    );

    if (matches) {
      // First, find the specified td cell
      let targetCell = element.querySelector(
        'td[role="gridcell"][tabindex="-1"]'
      );
      // If the cell is not found, fallback to the traditional element
      if (!targetCell) {
        targetCell = element;
      }

      // Check if this label already exists inside the target cell
      const existingLabels = targetCell.querySelectorAll(
        ".gmail-label-extension"
      );
      const labelExists = Array.from(existingLabels).some(
        (label) => label.textContent === rule.label
      );

      // Only add if label doesn't exist yet
      if (!labelExists) {
        const visualLabel = createVisualLabel(rule.label, rule.color);
        visualLabel.classList.add("gmail-label-extension"); // Add identifier class
        targetCell.appendChild(visualLabel);
      }
    }
  }
}

// Main function to process emails
async function processEmails(): Promise<void> {
  try {
    // Find mail container
    const mailElement = await searchMailElement();
    if (!mailElement) return;

    // Process each email row
    const emailRows = mailElement.childNodes;
    for (const element of emailRows) {
      if (element.nodeType === Node.ELEMENT_NODE) {
        await processEmailElement(element as HTMLElement);
      }
    }
  } catch (error) {
    console.error("Error processing emails:", error);
  }
}

// Initialize the extension
async function initializeExtension(): Promise<void> {
  try {
    // Initial processing
    await processEmails();

    // Set up history state observer
    const pushState = history.pushState;
    history.pushState = function (
      data: any,
      unused: string,
      url?: string | URL
    ) {
      pushState.call(history, data, unused, url);
      setTimeout(processEmails, 1000);
    };

    // Create MutationObserver to watch for new emails
    const observer = new MutationObserver(() => {
      processEmails().catch((error) => {
        console.error("Error in mutation observer:", error);
      });
    });

    // Start observing once mail element is found
    const mailElement = await searchMailElement();
    if (mailElement) {
      observer.observe(mailElement, { childList: true, subtree: true });
    }
  } catch (error) {
    console.error("Error initializing extension:", error);
  }
}

// Start the extension with a delay to ensure Gmail is loaded
setTimeout(initializeExtension, 2000);

// Watch for changes in the mail rows container
async function watchMailRowsContainer(): Promise<void> {
  const container = await searchMailRowsContainer();
  if (container) {
    const observer = new MutationObserver(() => {
      processEmails().catch((error) => {
        console.error("Error in mail rows container observer:", error);
      });
    });
    observer.observe(container, { childList: true, subtree: true });
  }
}

// Start watching the mail rows container
setTimeout(watchMailRowsContainer, 2000);

// Watch for changes in storage
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "sync" && changes.labelRules) {
    // Clear existing labels
    const existingLabels = document.querySelectorAll(".gmail-label-extension");
    existingLabels.forEach((label) => label.remove());

    // Reprocess emails with new rules
    processEmails().catch((error) => {
      console.error("Error processing emails after rules update:", error);
    });
  }
});
