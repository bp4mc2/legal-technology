import React, { useCallback, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { apiFetch } from "../utils/api";
import { getRouteConfigForPath } from "../app/routes";

type AssistantResponse = {
  intent: string;
  action: string;
  parameters: Record<string, any>;
  summary?: string;
  error?: string;
  timestamp?: string;
  handler_result?: {
    type?: string;
    executed?: boolean;
    sparql?: string;
    results?: any;
    reason?: string;
    summary?: string;
  } | null;
};

type AssistantStatusResponse = {
  status?: string;
  model_available?: boolean;
  message?: string;
};

type AssistantHistoryItem = {
  id: string;
  pageKey: string;
  question: string;
  response: AssistantResponse;
  createdAt: string;
};

type AssistantSkill = {
  meta: {
    name: string;
    description?: string;
  };
  prompt?: string;
  path?: string;
  triggers?: string[];
  execution_type?: string;
  handler?: string | null;
};

type BackendSkillSummary = {
  name: string;
  description?: string;
  triggers?: string[];
  intents?: string[];
  execution_type?: string;
  handler?: string | null;
};

type AssistantSkillsPayload =
  | AssistantSkill[]
  | BackendSkillSummary[]
  | Record<string, AssistantSkill | BackendSkillSummary>;

const ASSISTANT_OPEN_SESSION_KEY = "lt-assistant-open";
const ASSISTANT_HISTORY_SESSION_KEY = "lt-assistant-history-by-page";
const ASSISTANT_STATUS_SESSION_KEY = "lt-assistant-status";

const readCachedAssistantStatus = (): AssistantStatusResponse | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.sessionStorage.getItem(ASSISTANT_STATUS_SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AssistantStatusResponse;
  } catch {
    return null;
  }
};

const writeCachedAssistantStatus = (status: AssistantStatusResponse) => {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(
    ASSISTANT_STATUS_SESSION_KEY,
    JSON.stringify(status),
  );
};

const readAssistantOpenState = (): boolean => {
  if (typeof window === "undefined") {
    return false;
  }
  return window.sessionStorage.getItem(ASSISTANT_OPEN_SESSION_KEY) === "1";
};

const readAssistantHistory = (): Record<string, AssistantHistoryItem[]> => {
  if (typeof window === "undefined") {
    return {};
  }

  const raw = window.sessionStorage.getItem(ASSISTANT_HISTORY_SESSION_KEY);
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, AssistantHistoryItem[]>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (_error) {
    return {};
  }
};

// const normalizeSkills = (
//   payload: AssistantSkillsPayload | null | undefined,
// ): AssistantSkill[] => {
//   if (!payload) {
//     return [];
//   }

//   if (Array.isArray(payload)) {
//     return payload;
//   }

//   return Object.entries(payload).reduce<AssistantSkill[]>(
//     (acc, [key, skill]) => {
//       if (
//         !skill ||
//         typeof skill !== "object" ||
//         !skill.meta ||
//         typeof skill.meta !== "object"
//       ) {
//         return acc;
//       }

//       const name =
//         typeof skill.meta.name === "string" && skill.meta.name.trim()
//           ? skill.meta.name
//           : key;

//       acc.push({
//         ...skill,
//         meta: {
//           ...skill.meta,
//           name,
//         },
//       });

//       return acc;
//     },
//     [],
//   );
// };

const isAssistantSkill = (
  value: AssistantSkill | BackendSkillSummary,
): value is AssistantSkill => {
  return Boolean(
    value &&
    typeof value === "object" &&
    "meta" in value &&
    value.meta &&
    typeof value.meta === "object",
  );
};

const normalizeSkills = (
  payload: AssistantSkillsPayload | null | undefined,
): AssistantSkill[] => {
  if (!payload) {
    return [];
  }

  const entries = Array.isArray(payload)
    ? payload.map((skill, index) => [String(index), skill] as const)
    : Object.entries(payload);

  return entries.reduce<AssistantSkill[]>((acc, [key, skill]) => {
    if (!skill || typeof skill !== "object") {
      return acc;
    }

    if (isAssistantSkill(skill)) {
      const name =
        typeof skill.meta.name === "string" && skill.meta.name.trim()
          ? skill.meta.name
          : key;

      acc.push({
        ...skill,
        meta: {
          ...skill.meta,
          name,
        },
      });

      return acc;
    }

    const name =
      typeof skill.name === "string" && skill.name.trim() ? skill.name : key;

    acc.push({
      meta: {
        name,
        description: skill.description,
      },
      triggers: skill.triggers,
      execution_type: skill.execution_type,
      handler: skill.handler,
    });

    return acc;
  }, []);
};

type RichPromptEditorProps = {
  value: string;
  onChange: (value: string) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  placeholder?: string;
  className?: string;
  skills: AssistantSkill[];
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const readEditorPlainText = (root: HTMLElement): string => {
  const raw = root.textContent ?? "";
  return raw
    .replace(/\u00A0/g, " ")
    .replace(/\r/g, "")
    .replace(/\n$/, "");
};

const getCommittedSkillName = (
  value: string,
  skills: AssistantSkill[],
): string | null => {
  const match = value.match(/^\/([^\s]+)(\s+|$)/);
  if (!match) {
    return null;
  }

  const typedSkill = match[1].toLowerCase();
  const matchedSkill = skills.find(
    (skill) => skill.meta.name.toLowerCase() === typedSkill,
  );

  return matchedSkill ? matchedSkill.meta.name : null;
};

const editorHasSkillToken = (root: HTMLElement, skillName: string | null) => {
  if (!skillName) {
    return !root.querySelector('[data-skill-token="true"]');
  }

  const token = root.querySelector('[data-skill-token="true"]');
  if (!token) {
    return false;
  }

  return token.textContent === `/${skillName}`;
};

const normalizeEditorText = (value: string) =>
  value
    .replace(/\u00A0/g, " ")
    .replace(/\r/g, "")
    .replace(/\n$/, "");

const textToHtml = (value: string) =>
  escapeHtml(value).replace(/ {2}/g, " &nbsp;").replace(/\n/g, "<br />");

const buildPromptMarkup = (value: string, skills: AssistantSkill[]) => {
  if (!value) {
    return "";
  }

  // const match = value.match(/^\/([^\s]+)([\s\n]?)/);
  const match = value.match(/^\/([^\s]+)([\s\n]+)/);
  if (!match) {
    return textToHtml(value);
  }

  const skillName = match[1];
  const separator = match[2] ?? "";

  const knownSkill = skills.some(
    (skill) => skill.meta.name.toLowerCase() === skillName.toLowerCase(),
  );

  if (!knownSkill) {
    return textToHtml(value);
  }

  const fullTokenLength = 1 + skillName.length + separator.length;
  const remainder = value.slice(fullTokenLength);

  // const skillToken = `<span data-skill-token="true" contenteditable="false" class="inline-block align-middle rounded-md border border-indigo-200 bg-indigo-50 px-2 py-0.5 font-mono text-sm font-semibold leading-5 text-indigo-700">/${escapeHtml(skillName)}</span>`;
  const skillToken = `<span data-skill-token="true" contenteditable="false" class="inline-block align-middle rounded-md border border-indigo-200 bg-indigo-50 px-2 py-0.5 font-mono text-sm font-semibold leading-5 text-indigo-700">/${escapeHtml(skillName)}</span>`;
  // const skillToken = `
  //   <span
  //     data-skill-token="true"
  //     contenteditable="false"
  //     class="inline-flex items-center rounded-md border border-indigo-200 bg-indigo-50 px-2 py-0.5 font-mono text-sm font-semibold text-indigo-700"
  //   >/${escapeHtml(skillName)}</span>
  // `;

  // const spaceHtml = spacer ? "&nbsp;" : "";

  const separatorHtml =
    separator === " " ? "&nbsp;" : separator === "\n" ? "<br />" : "";

  return `${skillToken}${separatorHtml}${textToHtml(remainder)}`;
};

const getCaretOffset = (root: HTMLElement): number => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return 0;
  }

  const range = selection.getRangeAt(0);
  const preRange = range.cloneRange();
  preRange.selectNodeContents(root);
  preRange.setEnd(range.endContainer, range.endOffset);

  return normalizeEditorText(preRange.toString()).length;
};

const setCaretOffset = (root: HTMLElement, targetOffset: number) => {
  const selection = window.getSelection();
  if (!selection) {
    return;
  }

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let currentNode = walker.nextNode();
  let charsSeen = 0;

  while (currentNode) {
    const nodeText = currentNode.textContent ?? "";
    const nextCharsSeen = charsSeen + nodeText.length;

    if (targetOffset <= nextCharsSeen) {
      const range = document.createRange();
      range.setStart(currentNode, Math.max(0, targetOffset - charsSeen));
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      return;
    }

    charsSeen = nextCharsSeen;
    currentNode = walker.nextNode();
  }

  const range = document.createRange();
  range.selectNodeContents(root);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
};

const RichPromptEditor: React.FC<RichPromptEditorProps> = ({
  value,
  onChange,
  onKeyDown,
  placeholder,
  className,
  skills,
}) => {
  const editorRef = React.useRef<HTMLDivElement | null>(null);

  React.useLayoutEffect(() => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    const currentText = readEditorPlainText(editor);
    const committedSkillName = getCommittedSkillName(value, skills);
    const markupHasSkillToken =
      currentText === value && editorHasSkillToken(editor, committedSkillName);
    if (markupHasSkillToken) {
      return;
    }

    const caretOffset = getCaretOffset(editor);
    editor.innerHTML = buildPromptMarkup(value, skills);
    setCaretOffset(editor, Math.min(caretOffset, value.length));
  }, [value, skills]);

  const handleInput = () => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    const nextValue = readEditorPlainText(editor);
    onChange(nextValue);
  };

  return (
    <div className="relative">
      {!value ? (
        <div className="pointer-events-none absolute px-2 py-1 text-sm leading-6 text-slate-400">
          {placeholder}
        </div>
      ) : // <div className="pointer-events-none absolute left-3 top-2 text-sm text-slate-400">
      //   {placeholder}
      // </div>
      null}

      <div
        ref={editorRef}
        role="textbox"
        aria-multiline="true"
        contentEditable
        suppressContentEditableWarning
        spellCheck={false}
        onInput={handleInput}
        onKeyDown={onKeyDown}
        // className={`${className} min-h-[104px] whitespace-pre-wrap break-words`}
        // className={`${className} min-h-[104px] whitespace-pre-wrap break-words cursor-text outline-none`}
        className={`${className} min-h-[104px] cursor-text whitespace-pre-wrap break-words outline-none`}
      />
    </div>
  );
};

type AssistantAskPayload = {
  query: string;
  language: "nl" | "en";
  context: {
    page: {
      title: string;
      label: string;
      path: string;
      search: string;
      section: string;
      subtitle?: string;
      url?: string;
    };
    selection: string;
    entity: Record<string, unknown>;
    extra: Record<string, unknown>;
  };
};

const extractSkillCommand = (
  value: string,
  skills: AssistantSkill[],
): { requestedSkill: string | null; query: string } => {
  const trimmed = value.trim();
  const match = trimmed.match(/^\/([^\s]+)\s*(.*)$/s);

  if (!match) {
    return {
      requestedSkill: null,
      query: trimmed,
    };
  }

  const typedSkill = match[1].toLowerCase();
  const matchedSkill = skills.find(
    (skill) => skill.meta.name.toLowerCase() === typedSkill,
  );

  if (!matchedSkill) {
    return {
      requestedSkill: null,
      query: trimmed,
    };
  }

  return {
    requestedSkill: matchedSkill.meta.name,
    query: match[2].trim(),
  };
};

const getCurrentSelectionText = (): string => {
  if (typeof window === "undefined") {
    return "";
  }

  return window.getSelection()?.toString().trim() ?? "";
};

const AssistantPanel: React.FC = () => {
  const location = useLocation();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState<boolean>(readAssistantOpenState);
  const [statusMessage, setStatusMessage] = useState<string>(
    "Model status wordt gecontroleerd...",
  );
  const [modelAvailable, setModelAvailable] = useState<boolean>(false);
  const [statusRefreshing, setStatusRefreshing] = useState(false);
  const [historyByPage, setHistoryByPage] =
    useState<Record<string, AssistantHistoryItem[]>>(readAssistantHistory);
  // Skills state
  const [skills, setSkills] = useState<AssistantSkill[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [showSkillMenu, setShowSkillMenu] = useState(false);
  const [selectedSkillIndex, setSelectedSkillIndex] = useState(0);

  const lastAskTimeRef = useRef(0);

  const applyAssistantStatus = useCallback(
    (status: AssistantStatusResponse) => {
      const isAvailable =
        typeof status.model_available === "boolean"
          ? status.model_available
          : status.status === "ok";

      setModelAvailable(Boolean(isAvailable));
      setStatusMessage(
        status.message ||
          (isAvailable ? "Model beschikbaar" : "Model niet beschikbaar"),
      );
    },
    [],
  );

  React.useEffect(() => {
    let isMounted = true;

    const loadSkills = async () => {
      if (!isOpen || !modelAvailable) {
        return;
      }

      setSkillsLoading(true);
      try {
        const result = await apiFetch<AssistantSkillsPayload>(
          "/api/assistant/skills",
        );
        if (!isMounted) {
          return;
        }
        setSkills(normalizeSkills(result));
      } catch (_error) {
        if (!isMounted) {
          return;
        }
        setSkills([]);
      } finally {
        if (isMounted) {
          setSkillsLoading(false);
        }
      }
    };

    void loadSkills();

    return () => {
      isMounted = false;
    };
  }, [isOpen, modelAvailable]);

  React.useEffect(() => {
    let isMounted = true;

    const applyStatus = (status: AssistantStatusResponse) => {
      const isAvailable =
        typeof status.model_available === "boolean"
          ? status.model_available
          : status.status === "ok";

      setModelAvailable(Boolean(isAvailable));
      setStatusMessage(
        status.message ||
          (isAvailable ? "Model beschikbaar" : "Model niet beschikbaar"),
      );
    };

    const loadStatus = async () => {
      const cached = readCachedAssistantStatus();

      if (cached) {
        applyAssistantStatus(cached);
        return;
      }

      try {
        const status = await apiFetch<AssistantStatusResponse>(
          "/api/assistant/status",
        );

        if (!isMounted) {
          return;
        }
        writeCachedAssistantStatus(status);
        applyAssistantStatus(status);
      } catch (_error) {
        if (!isMounted) {
          return;
        }
        setModelAvailable(false);
        setStatusMessage("Assistent status niet bereikbaar");
      }
    };

    void loadStatus();

    return () => {
      isMounted = false;
    };
  }, [applyAssistantStatus]);

  React.useEffect(() => {
    const handleOpenRequest = () => {
      if (modelAvailable) {
        setIsOpen(true);
      }
    };

    window.addEventListener("lt-assistant-open", handleOpenRequest);
    return () => {
      window.removeEventListener("lt-assistant-open", handleOpenRequest);
    };
  }, [modelAvailable]);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.sessionStorage.setItem(
      ASSISTANT_OPEN_SESSION_KEY,
      isOpen ? "1" : "0",
    );
  }, [isOpen]);

  React.useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", onEscape);
    return () => {
      window.removeEventListener("keydown", onEscape);
    };
  }, [isOpen]);

  const routeConfig = useMemo(
    () => getRouteConfigForPath(location.pathname),
    [location.pathname],
  );
  const pageKey = useMemo(
    () => `${location.pathname}${location.search}`,
    [location.pathname, location.search],
  );
  const pageHistory = useMemo(
    () => historyByPage[pageKey] ?? [],
    [historyByPage, pageKey],
  );

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || !modelAvailable) {
      return;
    }

    // let lastAskTime = 0;
    const now = Date.now();
    if (now - lastAskTimeRef.current < 2000) {
      setStatusMessage("Even geduld, de vorige vraag wordt nog verwerkt...");
      return;
    }
    lastAskTimeRef.current = now;

    const questionText = prompt.trim();
    const { requestedSkill, query } = extractSkillCommand(questionText, skills);

    if (!query) {
      setStatusMessage(
        "Stel eerst een vraag na de skill, bijvoorbeeld: /ontology Welke tools ondersteunen regelgeving?",
      );
      return;
    }

    const payload: AssistantAskPayload = {
      query,
      language: "nl",
      context: {
        page: {
          title: routeConfig.context.title,
          subtitle: routeConfig.context.subtitle,
          label: routeConfig.label,
          path: location.pathname,
          search: location.search || "",
          section: routeConfig.section,
          url: typeof window !== "undefined" ? window.location.href : undefined,
        },
        selection: getCurrentSelectionText(),
        entity: {},
        extra: {
          assistant: {
            requestedSkill,
            originalPrompt: questionText,
          },
          route: {
            pathname: location.pathname,
            search: location.search,
            pageKey,
          },
        },
      },
    };

    setLoading(true);

    try {
      const result = await apiFetch<AssistantResponse>("/api/assistant/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const historyItem: AssistantHistoryItem = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        pageKey,
        question: questionText,
        response: result,
        createdAt: new Date().toISOString(),
      };

      setHistoryByPage((prev) => {
        const next = {
          ...prev,
          [pageKey]: [...(prev[pageKey] ?? []), historyItem].slice(-25),
        };
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(
            ASSISTANT_HISTORY_SESSION_KEY,
            JSON.stringify(next),
          );
        }
        return next;
      });
      setPrompt("");
    } catch (e: any) {
      const errorResult: AssistantResponse = {
        intent: "error",
        action: "error",
        parameters: {},
        error: e.message,
      };

      const historyItem: AssistantHistoryItem = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        pageKey,
        question: questionText,
        response: errorResult,
        createdAt: new Date().toISOString(),
      };

      setHistoryByPage((prev) => {
        const next = {
          ...prev,
          [pageKey]: [...(prev[pageKey] ?? []), historyItem].slice(-25),
        };
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(
            ASSISTANT_HISTORY_SESSION_KEY,
            JSON.stringify(next),
          );
        }
        return next;
      });
    } finally {
      setLoading(false);
    }
  };

  const getIntentToneClass = (intent: string) => {
    const classes: Record<string, string> = {
      search: "border-l-sky-500",
      add: "border-l-emerald-500",
      edit: "border-l-amber-500",
      delete: "border-l-rose-500",
      show: "border-l-violet-500",
      stats: "border-l-cyan-500",
      info: "border-l-slate-500",
      error: "border-l-rose-600",
    };
    return classes[intent] || "border-l-slate-400";
  };

  const getIntentTextClass = (intent: string) => {
    const classes: Record<string, string> = {
      search: "text-sky-600",
      add: "text-emerald-600",
      edit: "text-amber-600",
      delete: "text-rose-600",
      show: "text-violet-600",
      stats: "text-cyan-600",
      info: "text-slate-600",
      error: "text-rose-700",
    };
    return classes[intent] || "text-slate-600";
  };

  const fieldControlClass =
    "w-full rounded-xl border border-slate-200 bg-white px-2 py-1 font-mono text-sm leading-6 text-slate-900 shadow-sm transition overflow-y-auto focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lt-primary";
  const primaryButtonClass =
    "inline-flex items-center justify-center rounded-md border border-lt-primary bg-lt-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lt-primary disabled:cursor-not-allowed disabled:opacity-50";
  const iconButtonClass =
    "inline-flex h-14 w-14 items-center justify-center rounded-full border shadow-lg transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lt-primary";
  const popupClass =
    "fixed bottom-24 right-6 z-[130] w-[calc(100vw-2rem)] max-w-[30rem] rounded-xl border border-lt-border bg-lt-card p-4 shadow-2xl";

  const refreshAssistantStatus = async (
    event?: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event?.stopPropagation();

    if (statusRefreshing) {
      return;
    }

    setStatusRefreshing(true);
    setStatusMessage("Model status wordt opnieuw gecontroleerd...");

    try {
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(ASSISTANT_STATUS_SESSION_KEY);
      }

      const status = await apiFetch<AssistantStatusResponse>(
        "/api/assistant/status?refresh=1",
      );

      writeCachedAssistantStatus(status);
      applyAssistantStatus(status);
    } catch (_error) {
      setModelAvailable(false);
      setStatusMessage("Assistent status niet bereikbaar");
    } finally {
      setStatusRefreshing(false);
    }
  };

  const launchTitle = modelAvailable
    ? "Open assistent"
    : `Assistent niet beschikbaar: ${statusMessage}`;

  const openAssistant = () => {
    if (!modelAvailable) {
      return;
    }
    setIsOpen(true);
  };

  const slashQuery = useMemo(() => {
    const value = prompt.trimStart();

    if (!value.startsWith("/")) {
      return null;
    }

    const firstToken = value.split(/\s+/)[0]; // "/search", "/se", "/"
    return firstToken.slice(1).toLowerCase(); // "search", "se", ""
  }, [prompt]);

  const filteredSkills = useMemo(() => {
    if (slashQuery === null) {
      return [];
    }

    if (!slashQuery) {
      return skills;
    }

    return skills.filter((skill) => {
      const haystack =
        `${skill.meta.name} ${skill.meta.description ?? ""}`.toLowerCase();
      return haystack.includes(slashQuery);
    });
  }, [skills, slashQuery]);

  const hasCommittedSkill = useMemo(() => {
    const match = prompt.match(/^\/([^\s]+)\s+/);
    if (!match) {
      return false;
    }

    const typedSkill = match[1].toLowerCase();
    return skills.some((skill) => skill.meta.name.toLowerCase() === typedSkill);
  }, [prompt, skills]);

  const isTypingSlashCommand = useMemo(() => {
    const trimmed = prompt.trimStart();
    return /^\/[^\s]*$/.test(trimmed);
  }, [prompt]);

  React.useEffect(() => {
    const shouldShow =
      isTypingSlashCommand && filteredSkills.length > 0 && !hasCommittedSkill;

    setShowSkillMenu(shouldShow);

    if (shouldShow) {
      setSelectedSkillIndex(0);
    }
  }, [isTypingSlashCommand, filteredSkills.length, hasCommittedSkill]);

  const applySkill = (skill: AssistantSkill) => {
    const trimmedLeft = prompt.replace(/^\s+/, "");
    const rest = trimmedLeft.startsWith("/")
      ? trimmedLeft.replace(/^\/\s*/, "")
      : trimmedLeft;

    // const nextPrompt = `/${skill.meta.name}${rest ? rest : " "}`;

    const nextPrompt = rest
      ? `/${skill.meta.name} ${rest}`
      : `/${skill.meta.name} `;

    setPrompt(nextPrompt);
    setShowSkillMenu(false);
  };

  const handlePromptKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!showSkillMenu || filteredSkills.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedSkillIndex((prev) => (prev + 1) % filteredSkills.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedSkillIndex(
        (prev) => (prev - 1 + filteredSkills.length) % filteredSkills.length,
      );
      return;
    }

    if (event.key === "Enter" || event.key === "Tab") {
      event.preventDefault();
      const selected = filteredSkills[selectedSkillIndex];
      if (selected) {
        applySkill(selected);
      }
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setShowSkillMenu(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-[120] group">
        <button
          type="button"
          onClick={openAssistant}
          disabled={!modelAvailable}
          aria-label={
            modelAvailable ? "Open assistent" : "Assistent niet beschikbaar"
          }
          className={`${iconButtonClass} relative bottom-0 right-0 ${modelAvailable ? "border-lt-primary bg-lt-primary text-white hover:bg-blue-700" : "cursor-not-allowed border-slate-300 bg-slate-200 text-slate-500"}`}
        >
          <svg
            className="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M7 9h10M7 13h7m-8 8 2.3-3.1a2 2 0 0 1 1.6-.8H17a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7a3 3 0 0 0-3 3v7a3 3 0 0 0 3 3h.1"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {!isOpen && !modelAvailable ? (
          <button
            type="button"
            onClick={refreshAssistantStatus}
            disabled={statusRefreshing}
            title="Controleer assistent opnieuw"
            aria-label="Controleer assistent opnieuw"
            className="absolute -left-2 -top-2 inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 shadow-md transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lt-primary disabled:cursor-wait disabled:opacity-60"
          >
            <svg
              className={`h-4 w-4 ${statusRefreshing ? "animate-spin" : ""}`}
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M20 12a8 8 0 1 1-2.34-5.66M20 4v6h-6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        ) : null}

        <div className="pointer-events-none absolute bottom-16 right-0 w-72 translate-y-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 opacity-0 shadow-md transition group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
          {launchTitle}
        </div>
      </div>

      {isOpen ? (
        <div
          className="fixed inset-0 z-[125]"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        >
          <div className="absolute inset-0 bg-slate-900/35" />
        </div>
      ) : null}

      {isOpen ? (
        <section
          className={popupClass}
          role="dialog"
          aria-modal="true"
          aria-label="Assistent popup"
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-lt-heading">
                Assistent
              </h3>
              <p className="mt-1 text-xs text-lt-muted">
                Context: {routeConfig.label} ({location.pathname})
              </p>
            </div>
            <button
              type="button"
              className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lt-primary"
              onClick={() => setIsOpen(false)}
            >
              Sluit
            </button>
          </div>

          <form onSubmit={handleAsk} className="grid gap-3">
            <div className="relative">
              {/* <textarea
                placeholder="Stel een vraag over deze pagina of data..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handlePromptKeyDown}
                rows={4}
                className={fieldControlClass}
              /> */}

              <RichPromptEditor
                value={prompt}
                onChange={setPrompt}
                onKeyDown={handlePromptKeyDown}
                placeholder="Stel een vraag over deze pagina of data..."
                className={fieldControlClass}
                skills={skills}
              />

              {showSkillMenu ? (
                <div className="absolute left-0 right-0 top-full z-20 mt-2 rounded-md border border-slate-300 bg-white shadow-lg">
                  <div className="max-h-56 overflow-auto py-1">
                    {filteredSkills.map((skill, index) => {
                      const active = index === selectedSkillIndex;
                      return (
                        <button
                          key={skill.meta.name}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => applySkill(skill)}
                          className={`block w-full px-3 py-2 text-left ${
                            active
                              ? "bg-blue-50 text-blue-700"
                              : "text-slate-800 hover:bg-slate-50"
                          }`}
                        >
                          <div className="text-sm font-medium">
                            /{skill.meta.name}
                          </div>
                          {skill.meta.description ? (
                            <div className="mt-0.5 text-xs text-slate-500">
                              {skill.meta.description}
                            </div>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-lt-muted">{statusMessage}</p>
              <button
                type="submit"
                disabled={loading || !prompt.trim() || !modelAvailable}
                className={primaryButtonClass}
              >
                {loading ? "Verwerking..." : "Vraag"}
              </button>
            </div>
          </form>

          {pageHistory.length > 0 ? (
            <div className="mt-3 max-h-64 space-y-3 overflow-auto pr-1">
              {pageHistory.map((item) => (
                <article
                  key={item.id}
                  className="rounded-md border border-lt-border bg-white p-3"
                >
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-lt-muted">
                    Vraag
                  </div>
                  <p className="mb-3 whitespace-pre-wrap text-sm text-lt-text">
                    {item.question}
                  </p>

                  <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-lt-muted">
                    Intent:{" "}
                    <span
                      className={`${getIntentTextClass(item.response.intent)} uppercase`}
                    >
                      {item.response.intent}
                    </span>
                  </div>

                  {item.response.action ? (
                    <div className="mb-2 text-xs text-lt-muted">
                      Action: {item.response.action}
                    </div>
                  ) : null}

                  <div
                    className={`rounded-md border border-l-4 border-lt-border p-2 ${getIntentToneClass(item.response.intent)} ${item.response.intent === "error" ? "bg-rose-50" : "bg-slate-50"}`}
                  >
                    {item.response.summary ? (
                      <div className="whitespace-pre-wrap text-sm text-lt-text">
                        {item.response.summary}
                      </div>
                    ) : null}

                    {Object.keys(item.response.parameters || {}).length > 0 ? (
                      <pre className="mt-2 max-h-32 overflow-auto rounded-md bg-white p-2 text-xs text-slate-700">
                        {JSON.stringify(item.response.parameters, null, 2)}
                      </pre>
                    ) : null}

                    {item.response.handler_result?.summary ? (
                      <div className="mt-2 rounded-md bg-white p-2 text-xs text-slate-700">
                        {item.response.handler_result.summary}
                      </div>
                    ) : null}

                    {item.response.handler_result?.sparql ? (
                      <div className="mt-2">
                        <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-lt-muted">
                          SPARQL
                        </div>
                        <pre className="max-h-40 overflow-auto rounded-md bg-white p-2 text-xs text-slate-700">
                          {item.response.handler_result.sparql}
                        </pre>
                      </div>
                    ) : null}

                    {item.response.handler_result?.results ? (
                      <div className="mt-2">
                        <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-lt-muted">
                          Resultaten
                        </div>
                        <pre className="max-h-40 overflow-auto rounded-md bg-white p-2 text-xs text-slate-700">
                          {JSON.stringify(
                            item.response.handler_result.results,
                            null,
                            2,
                          )}
                        </pre>
                      </div>
                    ) : null}

                    {item.response.handler_result?.reason ? (
                      <div className="mt-2 rounded-md bg-amber-50 p-2 text-xs text-amber-700">
                        {item.response.handler_result.reason}
                      </div>
                    ) : null}

                    {item.response.error ? (
                      <div className="mt-2 rounded-md bg-rose-50 p-2 text-xs text-rose-700">
                        {item.response.error}
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-2 text-[11px] text-lt-muted">
                    {new Date(item.createdAt).toLocaleTimeString("nl-NL")}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-3 rounded-md border border-dashed border-slate-300 bg-slate-50 p-3 text-xs text-lt-muted">
              Nog geen gesprek op deze pagina.
            </div>
          )}
        </section>
      ) : null}
    </>
  );
};

export default AssistantPanel;
