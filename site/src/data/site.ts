export const primaryActions = {
  download: {
    label: "Download App",
    href: "https://apps.apple.com/app/id1561831359",
  },
  remote: {
    label: "Open Web Remote",
    href: "https://remote.chatutil.top/",
  },
} as const;

export const siteUrl = "https://teleprompter.chatutil.top";

export const meta = {
  home: {
    title: "Teleprompter-float above apps, a floating teleprompter for iPhone",
    description:
      "Use AIPrompter to keep scripts floating above camera apps, video calls, livestream tools, and recording workflows.",
    path: "/",
  },
  faq: {
    title: "AIPrompter FAQ, floating teleprompter setup, and web remote help",
    description:
      "Learn how floating teleprompter mode works, how room-code remote control works, and how to set up cleaner recording sessions.",
    path: "/faq",
  },
} as const;

export const steps = [
  {
    title: "Write or paste your script",
    body: "Prepare the words you want to read before recording, livestreaming, teaching, or presenting.",
  },
  {
    title: "Float it above your recording app",
    body: "Start floating mode so the script stays visible while you use your camera, video, or meeting app.",
  },
  {
    title: "Enter the room code on web remote",
    body: "Optionally use another phone, tablet, or watch to control play, speed, and position without touching the recording device.",
  },
] as const;

export const faqItems = [
  {
    question: "What does floating above apps mean?",
    answer:
      "AIPrompter is designed to keep your script visible while you work in another recording app, so you can read without switching away from the camera or meeting screen.",
  },
  {
    question: "How does the web remote work?",
    answer:
      "Open the remote page on a second device, enter the room code from the prompter, and use the controls to manage playback, speed, and position remotely.",
  },
  {
    question: "Do I need two devices?",
    answer:
      "No. Floating teleprompter mode is the core app experience. A second device is useful when you want remote control during a more polished setup.",
  },
  {
    question: "What is the room code?",
    answer:
      "The room code is the short code shown by the prompter that pairs the web remote with the active device.",
  },
  {
    question: "Can I use it while recording?",
    answer:
      "Yes. The app is built for recording workflows where you need the script visible while your camera, livestream, or meeting app stays active.",
  },
] as const;
