/* ============================================
   RETRO TV PORTFOLIO - Projects Data
   Edit this file to customize your channels!
   ============================================ */

/**
 * Project/Channel Data Array
 * Each project represents a "TV channel"
 *
 * Properties:
 * - id: Unique identifier (channel number)
 * - title: Project name displayed on screen
 * - description: Short description (1-2 sentences)
 * - url: Link to the project (opens on screen click)
 * - thumbnail: Background image URL (or solid color)
 * - color: Optional accent color for this channel
 */
const PROJECTS = [
  {
    id: 1,
    title: "Visacus",
    description: "My personal portfolio website showcasing projects and skills.",
    url: "https://visacus.com",
    thumbnail: "linear-gradient(135deg, #f0f0f0 0%, #c0c0c0 30%, #808080 70%, #404040 100%)",
    icon: "🌐",
    color: "#888",
    screenshot: null  // Uses live proxy
  },
  {
    id: 2,
    title: "XJSON",
    description: "GitHub project - Extended JSON parser and utilities library.",
    url: "https://github.com/sharifli4/xjson",
    thumbnail: "linear-gradient(180deg, #e0e0e0 0%, #a0a0a0 40%, #606060 100%)",
    icon: "{ }",
    color: "#999",
    screenshot: null  // Uses live proxy
  },
  {
    id: 3,
    title: "Clickbait Hider",
    description: "Browser extension to hide clickbait content from your feed.",
    url: "https://github.com/sharifli4/clickbait-hider",
    thumbnail: "linear-gradient(45deg, #d0d0d0 0%, #909090 50%, #505050 100%)",
    icon: "🛡️",
    color: "#aaa",
    screenshot: null  // Uses live proxy
  },
  {
    id: 4,
    title: "LinkedIn",
    description: "Connect with me on LinkedIn - Kanan Sharifli.",
    url: "https://www.linkedin.com/in/kanan-sharifli/",
    thumbnail: "linear-gradient(160deg, #e8e8e8 0%, #b0b0b0 50%, #707070 100%)",
    icon: "in",
    color: "#777",
    useIcon: true  // Show icon instead of preview
  },
  {
    id: 5,
    title: "X / Twitter",
    description: "Follow me on X - @sharifli4",
    url: "https://x.com/sharifli4",
    thumbnail: "linear-gradient(135deg, #e0e0e0 0%, #a8a8a8 40%, #686868 100%)",
    icon: "𝕏",
    color: "#888",
    useIcon: true  // Show icon instead of preview
  }
];

/**
 * Get project by channel number
 * @param {number} channelNum - Channel number (1-based)
 * @returns {Object|null} Project object or null
 */
function getProject(channelNum) {
  return PROJECTS.find(p => p.id === channelNum) || null;
}

/**
 * Get total number of channels
 * @returns {number} Total projects count
 */
function getTotalChannels() {
  return PROJECTS.length;
}

/**
 * Get next channel number (wraps around)
 * @param {number} current - Current channel
 * @returns {number} Next channel number
 */
function getNextChannel(current) {
  const max = getTotalChannels();
  return current >= max ? 1 : current + 1;
}

/**
 * Get previous channel number (wraps around)
 * @param {number} current - Current channel
 * @returns {number} Previous channel number
 */
function getPrevChannel(current) {
  const max = getTotalChannels();
  return current <= 1 ? max : current - 1;
}

// Export for use in other modules
window.ProjectData = {
  projects: PROJECTS,
  getProject,
  getTotalChannels,
  getNextChannel,
  getPrevChannel
};
