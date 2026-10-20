import animatedHero from "../../../announcements/examples/animated/assets/78bafb6adbfd9da899cdbb5d934b4c0b9df5d419d6f0a5104a87a7b25dcc6bd8.html?raw";
import type { Announcement } from "@paperclipai/shared";
import { i18n } from "@/i18n";

/** Design guide / Storybook only. Never a runtime feed fallback. */
export const announcementPreview: Announcement = {
  id: "preview-work-together",
  eyebrow: "New in Paperclip",
  get title() {
    return i18n.t("rest.announcementPreview.giveYourNextIdeaA");
  },
  get description() {
    return i18n.t("rest.announcementPreview.bringAgentsProjectsAndWork");
  },
  image: { path: `assets/${"0".repeat(64)}.png`, alt: "Paperclip — ideas become work" },
  secondaryLink: { kind: "external", get label() {
    return i18n.t("rest.announcementPreview.learnMore");
  }, url: "https://paperclip.ing" },
  primaryAction: { kind: "route", get label() {
    return i18n.t("rest.announcementPreview.exploreYourProjects");
  }, path: "/projects" },
};

export const announcementAnimationPreview: Announcement = {
  ...announcementPreview,
  animation: { path: "assets/78bafb6adbfd9da899cdbb5d934b4c0b9df5d419d6f0a5104a87a7b25dcc6bd8.html", alt: "Agents plan, build and review work together." },
};
export const announcementAnimationPreviewSrc = `data:text/html;charset=utf-8,${encodeURIComponent(animatedHero)}`;
