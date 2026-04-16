export const primaryActions = {
  download: {
    label: "Download App",
    href: "https://apps.apple.com/",
  },
  remote: {
    label: "Open Web Remote",
    href: "https://remote.aiprompter.run/",
  },
} as const;

export const meta = {
  home: {
    title: "AIPrompter, a teleprompter app with web remote control",
    description:
      "Use AIPrompter to read scripts smoothly and control your teleprompter from another phone with a simple room code.",
    path: "/",
  },
  faq: {
    title: "AIPrompter FAQ, setup, room code, and web remote help",
    description:
      "Learn how AIPrompter works, how the room code setup works, and when to use the web remote during recording.",
    path: "/faq",
  },
} as const;

export const steps = [
  {
    title: "Open AIPrompter on your recording device",
    body: "Start your script on the main phone or iPad you use as the prompter.",
  },
  {
    title: "Get the room code from the prompter",
    body: "The app shows a room code that links the prompter to a separate controller device.",
  },
  {
    title: "Enter the room code on web remote",
    body: "Open the web remote on another phone and control play, speed, and position without touching the prompter.",
  },
] as const;

export const faqItems = [
  {
    question: "How does the web remote work?",
    answer:
      "Open the remote page on a second device, enter the room code from the prompter, and use the controls to manage playback remotely.",
  },
  {
    question: "Do I need two devices?",
    answer:
      "The remote experience works best with a second phone, but the app itself is still the main teleprompter experience.",
  },
  {
    question: "What is the room code?",
    answer:
      "The room code is the short code shown by the prompter that pairs the web remote with the active device.",
  },
  {
    question: "Can I use it while recording?",
    answer:
      "Yes. The remote flow is designed to help you adjust scrolling without touching the device that is being used for reading or recording.",
  },
] as const;
